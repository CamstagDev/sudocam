// Navegación entre pantallas por hash: #/menu, #/sudoku?dificultad=medio...
// Es una sola página: el guardado se carga una vez y vive en memoria entre
// pantallas, y funciona igual dentro de Electron y Capacitor que en el
// navegador.
//
// Cada pantalla es un objeto:
//   {
//     titulo,                     texto de la barra superior (opcional)
//     subtitulo,                  texto o función (params) => texto (opcional)
//     render(contenedor, params), dibuja la pantalla dentro de <main>
//     destruir(),                 limpia timers y listeners (opcional)
//     jefe(params),               id del jefe si es una pelea (opcional; para su tema)
//     antesDeSalir(),             true si se puede salir, o una promesa con la
//                                 respuesta del jugador (opcional; ver abajo)
//   }
// `params` son los parámetros que vienen después del "?" en el hash, como
// URLSearchParams.

const pantallas = new Map();
let pantallaActual = null;
let alCambiar = () => {};
let hashActual = '';
let salidaConfirmada = false; // el siguiente cambio de hash ya fue aprobado
let preguntando = false; // hay una confirmación abierta

export const RUTA_INICIO = 'menu';

export function registrarPantalla(ruta, pantalla) {
  pantallas.set(ruta, pantalla);
}

function leerHash() {
  const [ruta, consulta = ''] = window.location.hash.replace(/^#\/?/, '').split('?');
  return {
    ruta: pantallas.has(ruta) ? ruta : RUTA_INICIO,
    params: new URLSearchParams(consulta),
  };
}

function mostrar() {
  if (pantallaActual?.destruir) pantallaActual.destruir();
  hashActual = window.location.hash;
  const { ruta, params } = leerHash();
  pantallaActual = pantallas.get(ruta);
  alCambiar(ruta, pantallaActual, params);
}

// Salir de una pantalla que pide permiso (una pelea en curso): el hash ya
// cambió (un enlace, el botón de atrás del navegador o el gesto de atrás
// del teléfono), así que se vuelve a poner el de la pantalla actual sin
// redibujarla, y solo si el jugador confirma se va al destino.
async function alCambiarHash() {
  const destino = window.location.hash;
  // Mientras se pregunta, cualquier otro intento de salir se ignora.
  if (preguntando) {
    history.pushState(null, '', hashActual);
    return;
  }
  const permitido = salidaConfirmada || !pantallaActual?.antesDeSalir || pantallaActual.antesDeSalir();
  salidaConfirmada = false;
  if (permitido === true) {
    mostrar();
    return;
  }

  history.pushState(null, '', hashActual);
  preguntando = true;
  const confirmado = await permitido;
  preguntando = false;
  if (!confirmado) return;
  salidaConfirmada = true;
  window.location.hash = destino;
}

// navegar('sudoku', { dificultad: 'medio' }) -> #/sudoku?dificultad=medio
// Si el destino es el mismo hash en el que ya estamos (p. ej. "Jugar otra
// vez"), la pantalla se vuelve a dibujar igual.
export function navegar(ruta, params = {}) {
  const consulta = new URLSearchParams(params).toString();
  const hash = `#/${ruta}${consulta ? `?${consulta}` : ''}`;
  if (window.location.hash === hash) {
    mostrar();
  } else {
    window.location.hash = hash;
  }
}

// `cuandoCambie(ruta, pantalla, params)` lo pasa el cascarón de la app
// (main.js) para redibujar la barra superior y el contenido.
export function iniciarRouter(cuandoCambie) {
  alCambiar = cuandoCambie;
  window.addEventListener('hashchange', alCambiarHash);
  mostrar();
}
