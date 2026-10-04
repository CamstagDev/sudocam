// Dibuja un tablero (un 9x9 o un multi sudoku, según el lienzo) y avisa
// cuando el jugador toca una celda. No sabe nada de reglas ni de partidas:
// recibe en cada `dibujar` todo lo que tiene que mostrar. La usan el
// sudoku normal, el multi sudoku y los jefes.
//
//   const vista = crearVistaTablero(contenedor, { lienzo, alTocarCelda: (indice) => ... });
//   vista.dibujar({ tablero, fijas, notas, errores, seleccionada, resaltarRelacionadas, resaltarIguales, marcas });
//
// `marcas` (opcional) pone clases extra en algunas celdas, por ejemplo
// para los jefes: { jefe: Set de índices, 'jefe-buscando': Set... }
// `notasFalsas` (opcional, Hecate) muestra una nota con otro número:
// Map(celda -> Map(nota real -> número que se muestra)).

import { TAMANO_CAJA, TAMANO_GRILLA } from '../game/sudoku/lienzo.js';

// Líneas gruesas entre cajas de 3x3: a la derecha de las columnas locales
// 2 y 5, y debajo de las filas 2 y 5 (nunca en el borde de la grilla).
// Una celda compartida por dos grillas lleva la línea si cualquiera de las
// dos la pide.
function esFinDeCaja(posicionLocal) {
  return posicionLocal % TAMANO_CAJA === TAMANO_CAJA - 1 && posicionLocal < TAMANO_GRILLA - 1;
}

function crearCelda(indice, lienzo) {
  const lugares = lienzo.ubicaciones[indice];
  const celda = document.createElement('button');
  celda.type = 'button';
  celda.className = 'celda';
  celda.style.gridRow = String(Math.floor(indice / lienzo.ancho) + 1);
  celda.style.gridColumn = String((indice % lienzo.ancho) + 1);
  celda.classList.toggle('borde-caja-derecha', lugares.some((lugar) => esFinDeCaja(lugar.columna)));
  celda.classList.toggle('borde-caja-abajo', lugares.some((lugar) => esFinDeCaja(lugar.fila)));
  celda.classList.toggle('compartida', lugares.length > 1);
  celda.innerHTML = `
    <span class="celda-valor"></span>
    <span class="celda-notas">
      ${'<span class="nota"></span>'.repeat(9)}
    </span>
  `;
  return celda;
}

export function crearVistaTablero(contenedor, { lienzo, alTocarCelda }) {
  const tableroEl = document.createElement('div');
  tableroEl.className = lienzo.cantidadGrillas > 1 ? 'tablero tablero-multi' : 'tablero';
  tableroEl.style.gridTemplateColumns = `repeat(${lienzo.ancho}, 1fr)`;
  tableroEl.style.gridTemplateRows = `repeat(${lienzo.alto}, 1fr)`;
  tableroEl.style.aspectRatio = `${lienzo.ancho} / ${lienzo.alto}`;

  // Solo se crean las celdas activas: los huecos de un multi sudoku quedan
  // vacíos en la grilla CSS.
  const celdas = new Map();
  for (const indice of lienzo.celdas) {
    const celda = crearCelda(indice, lienzo);
    celda.addEventListener('click', () => alTocarCelda(indice));
    celdas.set(indice, celda);
    tableroEl.appendChild(celda);
  }
  contenedor.appendChild(tableroEl);

  // Clases de `marcas` que se usaron alguna vez, para poder quitarlas
  // cuando dejan de venir.
  const clasesDeMarcas = new Set();

  function dibujar({
    tablero,
    fijas,
    notas,
    errores,
    seleccionada,
    resaltarRelacionadas = true,
    resaltarIguales = true,
    marcas = {},
    notasFalsas = new Map(),
  }) {
    Object.keys(marcas).forEach((clase) => clasesDeMarcas.add(clase));
    const valorSeleccionado = seleccionada === null ? 0 : tablero[seleccionada];
    const relacionadas = new Set(resaltarRelacionadas && seleccionada !== null ? lienzo.vecinos[seleccionada] : []);

    for (const [indice, celda] of celdas) {
      const valor = tablero[indice];
      const notasCelda = notas[indice];
      const conNotas = valor === 0 && notasCelda.size > 0;

      celda.querySelector('.celda-valor').textContent = valor === 0 ? '' : String(valor);
      if (conNotas) {
        const falsas = notasFalsas.get(indice);
        celda.querySelectorAll('.nota').forEach((nota, i) => {
          const digito = i + 1;
          const falsa = falsas?.get(digito);
          nota.textContent = notasCelda.has(digito) ? String(falsa ?? digito) : '';
          nota.classList.toggle('nota-falsa', falsa !== undefined);
        });
      }

      celda.classList.toggle('con-notas', conNotas);
      celda.classList.toggle('fija', fijas[indice]);
      celda.classList.toggle('error', errores.has(indice));
      celda.classList.toggle('seleccionada', indice === seleccionada);
      celda.classList.toggle('relacionada', relacionadas.has(indice));
      celda.classList.toggle('mismo-numero',
        resaltarIguales && valorSeleccionado !== 0 && indice !== seleccionada && valor === valorSeleccionado);
      for (const clase of clasesDeMarcas) {
        celda.classList.toggle(clase, Boolean(marcas[clase]?.has(indice)));
      }
    }
  }

  return { dibujar, elemento: tableroEl };
}
