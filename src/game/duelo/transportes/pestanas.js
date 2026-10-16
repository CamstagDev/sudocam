// Transporte de prueba: dos pestañas (o ventanas) del mismo navegador
// juegan un duelo entre sí, sin Bluetooth ni red, con BroadcastChannel.
// Sirve para probar el modo en la computadora mientras se desarrolla; en
// el teléfono el transporte será Nearby Connections, con los mismos pasos.
//
// Un transporte tiene tres operaciones, las mismas que ofrece Nearby:
//   esperarRival({ codigo }, alConectarse)   anunciarse y esperar a que alguien se una;
//                                            devuelve detener()
//   buscarDuelos(alCambiarLista)             lista de duelos cercanos [{ id, codigo }];
//                                            devuelve detener()
//   unirse(id)                               promesa con la conexión (ver memoria.js)
//
// Por dentro: todas las pestañas escuchan la "sala" común, donde los
// anfitriones se anuncian y los invitados piden unirse. Al aceptarse, la
// pareja pasa a un canal propio, que es la conexión del duelo.

const SALA = 'sudocam-duelo';
const CADA_CUANTO_ANUNCIAR_MS = 1000;
const OLVIDAR_DUELO_MS = 3000; // un anfitrión que no se anuncia en este tiempo ya no está
const ESPERA_PARA_UNIRSE_MS = 5000;
const LATIDO_MS = 1000;
const SIN_LATIDO_MS = 4000; // tanto tiempo sin noticias de la otra pestaña = se fue

const nuevoId = () => Math.random().toString(36).slice(2, 10);

// La conexión de un duelo sobre su canal propio. Al cerrarse, la otra
// pestaña avisa con 'cerrar'; como al cerrar la pestaña ese aviso no
// siempre alcanza a salir, cada punta además manda un latido cada segundo,
// y si deja de llegar se da la conexión por cortada. (Una pestaña oculta
// por más de 5 minutos puede quedar frenada por el navegador y parecer
// cortada: para probar, mejor dos ventanas a la vista.)
function crearConexion(nombreCanal) {
  const canal = new BroadcastChannel(nombreCanal);
  const oyentes = [];
  const alCerrar = [];
  let abierta = true;
  let ultimaNoticia = Date.now();

  const latido = setInterval(() => {
    if (Date.now() - ultimaNoticia > SIN_LATIDO_MS) {
      cerrarLocal();
      alCerrar.forEach((fn) => fn());
    } else {
      canal.postMessage({ tipo: 'latido' });
    }
  }, LATIDO_MS);

  function cerrarLocal() {
    if (!abierta) return;
    abierta = false;
    clearInterval(latido);
    window.removeEventListener('pagehide', cerrar);
    canal.close();
  }

  function cerrar() {
    if (!abierta) return;
    canal.postMessage({ tipo: 'cerrar' });
    cerrarLocal();
  }

  canal.onmessage = ({ data }) => {
    if (!abierta) return;
    ultimaNoticia = Date.now();
    if (data.tipo === 'latido') return;
    if (data.tipo === 'cerrar') {
      cerrarLocal();
      alCerrar.forEach((fn) => fn());
    } else {
      oyentes.forEach((fn) => fn(data.mensaje));
    }
  };
  window.addEventListener('pagehide', cerrar);

  return {
    enviar(mensaje) {
      if (abierta) canal.postMessage({ tipo: 'datos', mensaje });
    },
    alRecibir: (fn) => oyentes.push(fn),
    alCerrarse: (fn) => alCerrar.push(fn),
    cerrar,
  };
}

const canalDelDuelo = (idAnfitrion, idInvitado) => `${SALA}-${idAnfitrion}-${idInvitado}`;

function esperarRival({ codigo }, alConectarse) {
  const id = nuevoId();
  const sala = new BroadcastChannel(SALA);
  const anunciarse = () => sala.postMessage({ tipo: 'anuncio', id, codigo });

  function detener() {
    clearInterval(intervalo);
    sala.postMessage({ tipo: 'retirado', id });
    sala.close();
  }

  sala.onmessage = ({ data }) => {
    if (data.tipo === 'busco') anunciarse();
    if (data.tipo !== 'unirse' || data.a !== id) return;
    // El canal del duelo se abre antes de aceptar: así el primer mensaje
    // del invitado ya encuentra a alguien escuchando.
    const conexion = crearConexion(canalDelDuelo(id, data.de));
    sala.postMessage({ tipo: 'aceptado', de: id, a: data.de });
    detener();
    alConectarse(conexion);
  };

  anunciarse();
  const intervalo = setInterval(anunciarse, CADA_CUANTO_ANUNCIAR_MS);
  return detener;
}

function buscarDuelos(alCambiarLista) {
  const sala = new BroadcastChannel(SALA);
  const vistos = new Map(); // id -> { id, codigo, visto }

  const avisar = () => alCambiarLista([...vistos.values()].map(({ id, codigo }) => ({ id, codigo })));

  sala.onmessage = ({ data }) => {
    if (data.tipo === 'anuncio') {
      const nuevo = !vistos.has(data.id);
      vistos.set(data.id, { id: data.id, codigo: data.codigo, visto: Date.now() });
      if (nuevo) avisar();
    } else if (data.tipo === 'retirado' && vistos.delete(data.id)) {
      avisar();
    }
  };

  // Los que dejaron de anunciarse sin avisar (pestaña cerrada) se olvidan.
  const limpieza = setInterval(() => {
    let cambio = false;
    for (const [id, { visto }] of vistos) {
      if (Date.now() - visto > OLVIDAR_DUELO_MS) cambio = vistos.delete(id) || cambio;
    }
    if (cambio) avisar();
  }, CADA_CUANTO_ANUNCIAR_MS);

  sala.postMessage({ tipo: 'busco' });
  avisar();

  return () => {
    clearInterval(limpieza);
    sala.close();
  };
}

function unirse(idAnfitrion) {
  const id = nuevoId();
  const sala = new BroadcastChannel(SALA);

  return new Promise((resolver, rechazar) => {
    const plazo = setTimeout(() => {
      sala.close();
      rechazar(new Error('Ese duelo ya no está disponible.'));
    }, ESPERA_PARA_UNIRSE_MS);

    sala.onmessage = ({ data }) => {
      if (data.tipo !== 'aceptado' || data.de !== idAnfitrion || data.a !== id) return;
      clearTimeout(plazo);
      sala.close();
      resolver(crearConexion(canalDelDuelo(idAnfitrion, id)));
    };
    sala.postMessage({ tipo: 'unirse', de: id, a: idAnfitrion });
  });
}

export const transporteEntrePestanas = {
  nombre: 'pestanas',
  esperarRival,
  buscarDuelos,
  unirse,
};
