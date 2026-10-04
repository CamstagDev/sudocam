// Modal para elegir la dificultad del sudoku antes de una pelea (Babel).
//
//   const dificultad = await elegirDificultadDeJefe('Babel');   // 'facil' | 'medio' | 'dificil' | null

import { abrirModal } from './modal.js';
import { DIFICULTADES } from '../game/sudoku/dificultades.js';

const OPCIONES = ['facil', 'medio', 'dificil'];

export function elegirDificultadDeJefe(nombreJefe) {
  return new Promise((resolver) => {
    const contenido = document.createElement('div');
    contenido.innerHTML = `
      <p class="campo-ayuda tarjeta-ayuda">Dificultad del sudoku. Contra un jefe los errores se ven al instante.</p>
      <div class="opcion-picker">
        ${OPCIONES.map((id) => `
          <button type="button" class="opcion-fila" data-dificultad="${id}">
            <span class="opcion-fila-titulo">${DIFICULTADES[id].nombre}</span>
            <span class="opcion-fila-desc">${DIFICULTADES[id].pistas} números al empezar</span>
          </button>
        `).join('')}
      </div>
    `;

    let elegida = null;
    const modal = abrirModal({ titulo: `Enfrentar a ${nombreJefe}`, contenido, alCerrar: () => resolver(elegida) });
    contenido.querySelectorAll('[data-dificultad]').forEach((boton) => {
      boton.addEventListener('click', () => {
        elegida = boton.dataset.dificultad;
        modal.cerrar();
      });
    });
  });
}
