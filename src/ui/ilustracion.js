// Pone una imagen de public/ (por ejemplo './img/cartas/uriel.jpg') como
// la variable CSS --ilustracion de un elemento, que su CSS usa de fondo.
//
// La ruta se pasa a absoluta: un url() relativo dentro de una variable CSS
// se resuelve desde la hoja de estilos (dist/assets/), no desde la página,
// así que en el build (Windows y Android) la imagen no aparecería.
export function ponerIlustracion(elemento, ruta) {
  const absoluta = new URL(ruta, document.baseURI).href;
  elemento.style.setProperty('--ilustracion', `url("${absoluta}")`);
}
