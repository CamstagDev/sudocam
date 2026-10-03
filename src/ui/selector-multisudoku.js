// Modal "Nuevo Multi Sudoku": dificultad y cuántos tableros conectados.
//
//   const eleccion = await elegirMultiSudoku();
//   // null si cerró el modal, o { dificultad, cantidad }

import { abrirModal } from './modal.js';
import { DIFICULTADES } from '../game/sudoku/dificultades.js';
import { FORMAS } from '../game/multisudoku/formas.js';
import { TAMANO_GRILLA } from '../game/sudoku/lienzo.js';

const DIFICULTADES_MULTI = ['facil', 'medio', 'dificil'];

// Dibujito de la forma: un cuadrado por grilla, en su lugar del lienzo.
function miniaturaForma({ origenes }) {
  const ancho = Math.max(...origenes.map((o) => o.columna)) + TAMANO_GRILLA;
  const alto = Math.max(...origenes.map((o) => o.fila)) + TAMANO_GRILLA;
  const cuadrados = origenes.map(({ fila, columna }) => `
    <span style="
      left: ${(columna / ancho) * 100}%;
      top: ${(fila / alto) * 100}%;
      width: ${(TAMANO_GRILLA / ancho) * 100}%;
      height: ${(TAMANO_GRILLA / alto) * 100}%;
    "></span>
  `).join('');
  return `<span class="miniatura-forma" style="aspect-ratio: ${ancho} / ${alto}">${cuadrados}</span>`;
}

function opcion(atributo, valor, titulo, descripcion, extra = '') {
  return `
    <button type="button" class="opcion-fila" data-${atributo}="${valor}">
      ${extra}
      <span>
        <span class="opcion-fila-titulo">${titulo}</span>
        <span class="opcion-fila-desc">${descripcion}</span>
      </span>
    </button>
  `;
}

export function elegirMultiSudoku() {
  return new Promise((resolver) => {
    const contenido = document.createElement('div');
    contenido.innerHTML = `
      <div class="campo">
        <span class="campo-etiqueta">Dificultad</span>
        <div class="opcion-picker">
          ${DIFICULTADES_MULTI.map((id) => opcion('dificultad', id, DIFICULTADES[id].nombre, DIFICULTADES[id].descripcion)).join('')}
        </div>
      </div>
      <div class="campo">
        <span class="campo-etiqueta">Tableros conectados</span>
        <div class="opcion-picker">
          ${Object.entries(FORMAS).map(([cantidad, forma]) => opcion(
            'cantidad', cantidad, `${cantidad}: ${forma.nombre}`, forma.descripcion, miniaturaForma(forma),
          )).join('')}
        </div>
      </div>
      <button type="button" class="btn btn-primary btn-ancho" id="btn-comenzar">Comenzar</button>
    `;

    let eleccion = null;
    const modal = abrirModal({ titulo: 'Nuevo Multi Sudoku', contenido, alCerrar: () => resolver(eleccion) });
    const elegido = { dificultad: 'facil', cantidad: '2' };

    // Marca la opción elegida de cada lista ("dificultad" o "cantidad").
    function marcar(atributo) {
      contenido.querySelectorAll(`[data-${atributo}]`).forEach((boton) => {
        boton.classList.toggle('activo', boton.dataset[atributo] === elegido[atributo]);
      });
    }

    for (const atributo of ['dificultad', 'cantidad']) {
      contenido.querySelectorAll(`[data-${atributo}]`).forEach((boton) => {
        boton.addEventListener('click', () => {
          elegido[atributo] = boton.dataset[atributo];
          marcar(atributo);
        });
      });
      marcar(atributo);
    }

    contenido.querySelector('#btn-comenzar').addEventListener('click', () => {
      eleccion = { ...elegido };
      modal.cerrar();
    });
  });
}
