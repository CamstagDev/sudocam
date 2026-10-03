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
//   }
// `params` son los parámetros que vienen después del "?" en el hash, como
// URLSearchParams.

const pantallas = new Map();
let pantallaActual = null;
let alCambiar = () => {};

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
  const { ruta, params } = leerHash();
  pantallaActual = pantallas.get(ruta);
  alCambiar(ruta, pantallaActual, params);
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
  window.addEventListener('hashchange', mostrar);
  mostrar();
}
