// Dibuja un tablero de sudoku 9x9 y avisa cuando el jugador toca una celda.
// No sabe nada de reglas ni de partidas: recibe en cada `dibujar` todo lo
// que tiene que mostrar. La van a reusar el sudoku normal y los jefes.
//
//   const vista = crearVistaTablero(contenedor, { alTocarCelda: (indice) => ... });
//   vista.dibujar({ tablero, fijas, notas, errores, seleccionada, resaltarRelacionadas, resaltarIguales });

import { TOTAL_CELDAS, estanRelacionadas } from '../game/sudoku/tablero.js';

function crearCelda(indice) {
  const celda = document.createElement('button');
  celda.type = 'button';
  celda.className = 'celda';
  celda.dataset.indice = String(indice);
  celda.innerHTML = `
    <span class="celda-valor"></span>
    <span class="celda-notas">
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(() => '<span class="nota"></span>').join('')}
    </span>
  `;
  return celda;
}

export function crearVistaTablero(contenedor, { alTocarCelda }) {
  const tableroEl = document.createElement('div');
  tableroEl.className = 'tablero';

  const celdas = [];
  for (let indice = 0; indice < TOTAL_CELDAS; indice++) {
    const celda = crearCelda(indice);
    celda.addEventListener('click', () => alTocarCelda(indice));
    celdas.push(celda);
    tableroEl.appendChild(celda);
  }
  contenedor.appendChild(tableroEl);

  function dibujar({
    tablero,
    fijas,
    notas,
    errores,
    seleccionada,
    resaltarRelacionadas = true,
    resaltarIguales = true,
  }) {
    const valorSeleccionado = seleccionada === null ? 0 : tablero[seleccionada];

    celdas.forEach((celda, indice) => {
      const valor = tablero[indice];
      const notasCelda = notas[indice];
      const conNotas = valor === 0 && notasCelda.size > 0;

      celda.querySelector('.celda-valor').textContent = valor === 0 ? '' : String(valor);
      if (conNotas) {
        celda.querySelectorAll('.nota').forEach((nota, i) => {
          nota.textContent = notasCelda.has(i + 1) ? String(i + 1) : '';
        });
      }

      celda.classList.toggle('con-notas', conNotas);
      celda.classList.toggle('fija', fijas[indice]);
      celda.classList.toggle('error', errores.has(indice));
      celda.classList.toggle('seleccionada', indice === seleccionada);
      celda.classList.toggle('relacionada',
        resaltarRelacionadas && seleccionada !== null && estanRelacionadas(indice, seleccionada));
      celda.classList.toggle('mismo-numero',
        resaltarIguales && valorSeleccionado !== 0 && indice !== seleccionada && valor === valorSeleccionado);
    });
  }

  return { dibujar, elemento: tableroEl };
}
