// Generación de sudokus con solución única, para cualquier forma de
// tablero (ver lienzo.js): un 9x9 normal o un multi sudoku.
//
// 1. Se arma un tablero completo al azar.
// 2. Se van vaciando celdas en orden aleatorio, y una celda solo se deja
//    vacía si el puzzle sigue teniendo exactamente una solución.
// 3. Cada grilla para cuando llega a sus pistas objetivo (o en el mínimo
//    posible si la unicidad no deja bajar más).

import { mezclar } from './azar.js';
import { LIENZO_9X9, TAMANO_GRILLA } from './lienzo.js';
import { completarAlAzar, contarSoluciones } from './resolvedor.js';

const CELDAS_POR_GRILLA = TAMANO_GRILLA * TAMANO_GRILLA;

// Pasos máximos para comprobar que un puzzle tiene solución única. Si se
// agotan, esa celda se deja como pista (un poco más fácil) en vez de
// arriesgarse a congelar el juego. En un 9x9 casi nunca se llega.
const PRESUPUESTO_UNICIDAD = 5000;

// Tablero completo y válido, distinto en cada llamada. Con `fijas` (un
// tablero con algunas celdas ya puestas, 0 = libre) arranca respetándolas.
export function generarSolucion(lienzo = LIENZO_9X9, fijas = new Array(lienzo.totalCeldas).fill(0)) {
  const tablero = [...fijas];
  if (!completarAlAzar(tablero, lienzo)) {
    throw new Error('Esas celdas fijas no permiten completar el tablero');
  }
  return tablero;
}

function tieneSolucionUnica(puzzle, lienzo) {
  const { soluciones, agotado } = contarSoluciones(puzzle, lienzo, { presupuesto: PRESUPUESTO_UNICIDAD });
  return !agotado && soluciones === 1;
}

// Puzzle a partir de una solución completa. `pistas` es un número (igual
// para todas las grillas) o un arreglo con un objetivo por grilla. Las
// celdas de `fijas` nunca se vacían.
//
// Una celda compartida entre dos grillas cuenta para las dos: se intenta
// vaciar si a alguna todavía le sobran pistas, y al vaciarla resta de
// ambas.
export function vaciarHastaPistas(solucion, lienzo, pistas, fijas = null) {
  const objetivos = Array.isArray(pistas) ? pistas : new Array(lienzo.cantidadGrillas).fill(pistas);
  const pistasActuales = new Array(lienzo.cantidadGrillas).fill(CELDAS_POR_GRILLA);
  const grillasDe = (indice) => lienzo.ubicaciones[indice].map((lugar) => lugar.grilla);
  const puzzle = [...solucion];

  const candidatas = lienzo.celdas.filter((indice) => !fijas || fijas[indice] === 0);
  for (const indice of mezclar(candidatas)) {
    const grillas = grillasDe(indice);
    if (!grillas.some((grilla) => pistasActuales[grilla] > objetivos[grilla])) continue;

    const valor = puzzle[indice];
    puzzle[indice] = 0;

    if (tieneSolucionUnica(puzzle, lienzo)) {
      grillas.forEach((grilla) => pistasActuales[grilla]--);
    } else {
      puzzle[indice] = valor; // vaciarla dejaba más de una solución
    }
  }

  return puzzle;
}

// Todo junto: { puzzle, solucion }.
export function generarPuzzle(pistas, { lienzo = LIENZO_9X9, fijas = null } = {}) {
  const solucion = generarSolucion(lienzo, fijas ?? undefined);
  return { puzzle: vaciarHastaPistas(solucion, lienzo, pistas, fijas), solucion };
}
