// Carrusel de jefes del menú: se ve un jefe a la vez (su carta, con la
// vuelta a la uber de siempre) y, a los costados, una vista inclinada y
// semitransparente del anterior y el siguiente, que también sirven para
// moverse. Arriba, una fila de miniaturas redondas para saltar a cualquier
// jefe; la miniatura del jefe que está volteado muestra a su uber.
//
//   seccion.appendChild(crearCarruselJefes(['uriel', 'hecate', ...]));
//
// En el teléfono también se puede deslizar el dedo sobre la carta.

import { JEFES, imagenDeCarta } from '../game/jefes/catalogo.js';
import { crearCartaJefe } from './carta-jefe.js';
import { crearRetratoJefe } from './retrato-jefe.js';
import { buscarImagenDeJefe } from './imagen-de-jefe.js';

const DESLIZAMIENTO_MINIMO = 50; // px para que un deslizamiento cuente

// Mientras la app está abierta, el menú vuelve al último jefe que se miró
// y recuerda cuáles estaban volteados.
let ultimoMirado = null;
const volteados = new Set();

const idVisible = (id) => (volteados.has(id) ? `${id}_uber` : id);

function crearMiniatura(id, alTocar) {
  const miniatura = crearRetratoJefe(idVisible(id), { tamano: 'mini' });
  miniatura.classList.add('carrusel-miniatura');
  miniatura.addEventListener('click', alTocar);
  return miniatura;
}

// La vista de un vecino: su ilustración (o su emoji), inclinada.
function crearVecino(id, lado, alTocar) {
  const vecino = document.createElement('button');
  vecino.type = 'button';
  vecino.className = `carrusel-vecino ${lado}`;
  vecino.setAttribute('aria-label', `${lado === 'anterior' ? 'Anterior' : 'Siguiente'}: ${JEFES[idVisible(id)].nombre}`);
  vecino.innerHTML = `<span class="carrusel-vecino-emoji">${JEFES[idVisible(id)].emoji}</span>`;
  vecino.addEventListener('click', alTocar);
  buscarImagenDeJefe(idVisible(id), imagenDeCarta).then((ruta) => {
    if (ruta) vecino.style.setProperty('--ilustracion', `url("${ruta}")`);
  });
  return vecino;
}

export function crearCarruselJefes(ids) {
  const carrusel = document.createElement('div');
  carrusel.className = 'carrusel-jefes';
  carrusel.innerHTML = `
    <div class="carrusel-miniaturas"></div>
    <div class="carrusel-escena"></div>
  `;
  const filaMiniaturas = carrusel.querySelector('.carrusel-miniaturas');
  const escena = carrusel.querySelector('.carrusel-escena');
  let actual = Math.max(0, ids.indexOf(ultimoMirado));

  // Con dos jefes, el otro va de un solo lado; con tres o más, el carrusel
  // da la vuelta.
  function vecinoDe(paso) {
    const indice = actual + paso;
    if (indice >= 0 && indice < ids.length) return indice;
    return ids.length >= 3 ? (indice + ids.length) % ids.length : null;
  }

  function ir(indice) {
    actual = indice;
    ultimoMirado = ids[actual];
    dibujar();
  }

  function dibujarMiniaturas() {
    filaMiniaturas.replaceChildren(...ids.map((id, indice) => {
      const miniatura = crearMiniatura(id, () => ir(indice));
      miniatura.classList.toggle('activa', indice === actual);
      return miniatura;
    }));
  }

  function dibujar() {
    const id = ids[actual];
    const carta = crearCartaJefe(id, {
      volteada: volteados.has(id),
      alVoltear: (uber) => {
        if (uber) volteados.add(id);
        else volteados.delete(id);
        dibujarMiniaturas();
      },
    });
    carta.classList.add('carrusel-actual');

    const piezas = [carta];
    const anterior = vecinoDe(-1);
    const siguiente = vecinoDe(1);
    if (anterior !== null) piezas.unshift(crearVecino(ids[anterior], 'anterior', () => ir(anterior)));
    if (siguiente !== null) piezas.push(crearVecino(ids[siguiente], 'siguiente', () => ir(siguiente)));
    escena.replaceChildren(...piezas);

    dibujarMiniaturas();
  }

  // Deslizar el dedo sobre la carta: a la izquierda, el siguiente.
  let inicioToque = null;
  escena.addEventListener('touchstart', (evento) => {
    inicioToque = evento.touches[0].clientX;
  }, { passive: true });
  escena.addEventListener('touchend', (evento) => {
    if (inicioToque === null) return;
    const recorrido = evento.changedTouches[0].clientX - inicioToque;
    inicioToque = null;
    if (Math.abs(recorrido) < DESLIZAMIENTO_MINIMO) return;
    const destino = vecinoDe(recorrido < 0 ? 1 : -1);
    if (destino !== null) ir(destino);
  });

  // Un solo jefe: ni miniaturas ni vecinos.
  filaMiniaturas.classList.toggle('hidden', ids.length < 2);
  dibujar();
  return carrusel;
}
