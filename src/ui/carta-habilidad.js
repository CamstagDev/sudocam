// Carta de una habilidad de jefe: su icono, su nombre y su texto. Es la
// misma en la página de información del jefe (una debajo de otra) y en la
// pelea (flotando al pasar el mouse por el icono de la habilidad).
//
//   const carta = crearCartaHabilidad(JEFES.uriel.ataque1, { desbloqueada: true });
//
// `seccion` es una sección del catálogo (game/jefes/catalogo.js): una
// habilidad, la pasiva o el secreto. Bloqueada, la carta no cuenta nada:
// candado, "???", el texto tachado y la pista de cómo desbloquearla.

import { imagenDeHabilidad } from '../game/jefes/catalogo.js';

// El dibujo de la habilidad (el mismo de su icono en la pelea); sin
// dibujo, su emoji, y si tampoco tiene, nada.
function crearIcono(seccion, desbloqueada) {
  const icono = document.createElement('span');
  icono.className = 'carta-habilidad-icono';
  icono.setAttribute('aria-hidden', 'true');

  if (!desbloqueada) {
    icono.textContent = '🔒';
    return icono;
  }
  if (!seccion.imagen && !seccion.emoji) return null;

  icono.textContent = seccion.emoji ?? '';
  if (seccion.imagen) {
    const dibujo = new Image();
    dibujo.alt = '';
    dibujo.addEventListener('load', () => icono.replaceChildren(dibujo));
    dibujo.src = imagenDeHabilidad(seccion.imagen);
  }
  return icono;
}

export function crearCartaHabilidad(seccion, { desbloqueada }) {
  const carta = document.createElement('article');
  carta.className = `card carta-habilidad ${desbloqueada ? '' : 'bloqueada'}`;
  carta.innerHTML = `
    <div class="carta-habilidad-cuerpo">
      <h2 class="carta-habilidad-nombre"></h2>
    </div>
  `;
  const cuerpo = carta.querySelector('.carta-habilidad-cuerpo');
  const nombre = carta.querySelector('.carta-habilidad-nombre');

  const icono = crearIcono(seccion, desbloqueada);
  if (icono) carta.prepend(icono);

  if (desbloqueada) {
    nombre.textContent = seccion.titulo;
    const texto = document.createElement('p');
    texto.className = 'carta-habilidad-texto';
    texto.textContent = seccion.texto;
    cuerpo.appendChild(texto);
  } else {
    nombre.textContent = '???';
    cuerpo.insertAdjacentHTML('beforeend', `
      <div class="texto-tachado" aria-hidden="true"><span></span><span></span><span></span></div>
      <p class="campo-ayuda pista-seccion"></p>
    `);
    cuerpo.querySelector('.pista-seccion').textContent = seccion.pista;
  }
  return carta;
}
