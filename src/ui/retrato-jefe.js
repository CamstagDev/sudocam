// Retrato redondo de un jefe: su imagen (public/img/jefes/<id>.png) o, si
// todavía no existe, su emoji. Para agregar la imagen de un jefe basta con
// poner el archivo con ese nombre; no hace falta tocar código.
//
//   const retrato = crearRetratoJefe('uriel', { tamano: 'grande' });

import { JEFES, imagenDeJefe } from '../game/jefes/catalogo.js';

export function crearRetratoJefe(id, { tamano = 'normal', etiqueta = 'button' } = {}) {
  const jefe = JEFES[id];
  const retrato = document.createElement(etiqueta);
  if (etiqueta === 'button') retrato.type = 'button';
  retrato.className = `retrato-jefe retrato-${tamano}`;
  retrato.setAttribute('aria-label', jefe.nombre);
  retrato.innerHTML = `<span class="retrato-emoji">${jefe.emoji}</span>`;

  // Los uber usan la imagen de su versión normal (si no tienen la propia).
  const imagen = new Image();
  imagen.alt = '';
  imagen.addEventListener('load', () => retrato.replaceChildren(imagen));
  imagen.addEventListener('error', () => {
    if (jefe.normal && !imagen.dataset.respaldo) {
      imagen.dataset.respaldo = '1';
      imagen.src = imagenDeJefe(jefe.normal);
    }
  });
  imagen.src = imagenDeJefe(id);

  return retrato;
}
