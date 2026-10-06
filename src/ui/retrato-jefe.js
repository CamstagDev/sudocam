// Retrato redondo de un jefe (la miniatura de la pelea): su imagen
// (public/img/jefes/<id>.jpg) o, si todavía no existe, su emoji.
//
//   const retrato = crearRetratoJefe('uriel', { tamano: 'grande' });

import { JEFES, imagenDeJefe } from '../game/jefes/catalogo.js';
import { buscarImagenDeJefe } from './imagen-de-jefe.js';

export function crearRetratoJefe(id, { tamano = 'normal', etiqueta = 'button' } = {}) {
  const jefe = JEFES[id];
  const retrato = document.createElement(etiqueta);
  if (etiqueta === 'button') retrato.type = 'button';
  retrato.className = `retrato-jefe retrato-${tamano}`;
  retrato.setAttribute('aria-label', jefe.nombre);
  retrato.innerHTML = `<span class="retrato-emoji">${jefe.emoji}</span>`;

  buscarImagenDeJefe(id, imagenDeJefe).then((ruta) => {
    if (!ruta) return;
    const imagen = new Image();
    imagen.alt = '';
    imagen.src = ruta;
    retrato.replaceChildren(imagen);
  });

  return retrato;
}
