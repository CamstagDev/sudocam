// Transporte de verdad para el Duelo en Android: teléfono a teléfono, sin
// internet, con Nearby Connections (el plugin nativo NearbyDuelo, ver
// android/app/src/main/java/com/camstagdev/sudocam/NearbyDueloPlugin.java).
// Las mismas tres operaciones que el de prueba (ver pestanas.js):
//   esperarRival({ codigo }, alConectarse, alFallar)   devuelve detener()
//   buscarDuelos(alCambiarLista, alFallar)              devuelve detener()
//   unirse(id)                                          promesa con la conexión
// `alFallar(mensaje)` explica qué falta: permisos, Bluetooth apagado...
//
// Los eventos del plugin se escuchan una sola vez para todo el juego y se
// reparten desde aquí. Los mensajes que llegan antes de que la sesión del
// duelo empiece a escuchar (el "hola" del invitado puede adelantarse) se
// guardan y se le entregan en cuanto lo hace.

import { registerPlugin } from '@capacitor/core';

const Nearby = registerPlugin('NearbyDuelo');

const conexiones = new Map(); // id del otro teléfono -> { entregar(mensaje), cortar() }
const enEspera = new Map(); // id -> mensajes que llegaron antes de que alguien escuche
const hallados = new Map(); // id -> { id, codigo } de los duelos encontrados cerca
let alConectarseAnfitrion = null; // (id) => ..., mientras se espera rival
let alCambiarHallazgos = null; // () => ..., mientras se buscan duelos

let escuchando = null;

function escuchar() {
  escuchando ??= Promise.all([
    Nearby.addListener('mensaje', ({ id, texto }) => {
      const mensaje = JSON.parse(texto);
      const conexion = conexiones.get(id);
      if (conexion) conexion.entregar(mensaje);
      else enEspera.set(id, [...(enEspera.get(id) ?? []), mensaje]);
    }),
    Nearby.addListener('desconectado', ({ id }) => conexiones.get(id)?.cortar()),
    Nearby.addListener('conectado', ({ id }) => alConectarseAnfitrion?.(id)),
    Nearby.addListener('encontrado', ({ id, nombre }) => {
      hallados.set(id, { id, codigo: nombre });
      alCambiarHallazgos?.();
    }),
    Nearby.addListener('perdido', ({ id }) => {
      if (hallados.delete(id)) alCambiarHallazgos?.();
    }),
  ]);
  return escuchando;
}

// Escuchar los eventos y revisar permisos, Bluetooth, etc. Si algo falta,
// la promesa falla con el mensaje para el jugador.
async function prepararse() {
  await escuchar();
  await Nearby.prepararse();
}

// La conexión con el otro teléfono (ver memoria.js para la interfaz).
function crearConexion(id) {
  const oyentes = [];
  const alCerrar = [];
  let abierta = true;
  let ultimoEnvio = Promise.resolve();

  function olvidar() {
    abierta = false;
    conexiones.delete(id);
    enEspera.delete(id);
  }

  conexiones.set(id, {
    entregar: (mensaje) => oyentes.forEach((fn) => fn(mensaje)),
    cortar() {
      if (!abierta) return;
      olvidar();
      alCerrar.forEach((fn) => fn());
    },
  });

  return {
    enviar(mensaje) {
      if (!abierta) return;
      ultimoEnvio = Nearby.enviar({ id, texto: JSON.stringify(mensaje) }).catch(() => {});
    },
    alRecibir(fn) {
      oyentes.push(fn);
      const anteriores = enEspera.get(id) ?? [];
      enEspera.delete(id);
      anteriores.forEach(fn);
    },
    alCerrarse: (fn) => alCerrar.push(fn),
    cerrar() {
      if (!abierta) return;
      olvidar();
      // Primero que salga lo último enviado (p. ej. el "adios").
      ultimoEnvio.finally(() => Nearby.desconectar({ id }));
    },
  };
}

function esperarRival({ codigo }, alConectarse, alFallar) {
  let activo = true;
  alConectarseAnfitrion = (id) => {
    if (!activo) return;
    activo = false;
    alConectarseAnfitrion = null;
    alConectarse(crearConexion(id));
  };

  prepararse()
    .then(() => activo && Nearby.anunciar({ nombre: codigo }))
    .catch((error) => activo && alFallar(error.message));

  return () => {
    if (!activo) return;
    activo = false;
    alConectarseAnfitrion = null;
    Nearby.detenerAnuncio();
  };
}

function buscarDuelos(alCambiarLista, alFallar) {
  let activo = true;
  hallados.clear();
  alCambiarHallazgos = () => alCambiarLista([...hallados.values()]);
  alCambiarHallazgos();

  prepararse()
    .then(() => activo && Nearby.buscar())
    .catch((error) => activo && alFallar(error.message));

  return () => {
    if (!activo) return;
    activo = false;
    alCambiarHallazgos = null;
    Nearby.detenerBusqueda();
  };
}

async function unirse(id) {
  await escuchar();
  await Nearby.conectar({ id, nombre: 'Invitado' });
  return crearConexion(id);
}

export const transporteNearby = {
  nombre: 'nearby',
  esperarRival,
  buscarDuelos,
  unirse,
};
