// Navegación entre pantallas por hash (#/menu, #/sudoku, ...). Es una sola
// página: el guardado se carga una vez y vive en memoria entre pantallas,
// y funciona igual dentro de Electron y Capacitor que en el navegador.
//
// Cada pantalla es un objeto { titulo, subtitulo?, render(contenedor), destruir?() }.
// `render` dibuja dentro de <main>; `destruir` (opcional) limpia timers o
// listeners globales antes de cambiar de pantalla.

const pantallas = new Map();
let pantallaActual = null;
let alCambiar = () => {};

export const RUTA_INICIO = 'menu';

export function registrarPantalla(ruta, pantalla) {
  pantallas.set(ruta, pantalla);
}

export function rutaActual() {
  const ruta = window.location.hash.replace(/^#\/?/, '');
  return pantallas.has(ruta) ? ruta : RUTA_INICIO;
}

export function navegar(ruta) {
  window.location.hash = `#/${ruta}`;
}

function mostrar() {
  if (pantallaActual?.destruir) pantallaActual.destruir();
  const ruta = rutaActual();
  pantallaActual = pantallas.get(ruta);
  alCambiar(ruta, pantallaActual);
}

// `cuandoCambie(ruta, pantalla)` lo llama el cascarón de la app (main.js)
// para redibujar la barra superior y el contenido.
export function iniciarRouter(cuandoCambie) {
  alCambiar = cuandoCambie;
  window.addEventListener('hashchange', mostrar);
  mostrar();
}
