// Generación de un multi sudoku.
//
// Es el mismo generador del sudoku normal (game/sudoku/generador.js) sobre
// un lienzo más grande. Cada grilla puede pedir su propia cantidad de
// pistas: así Typhon podrá mezclar dificultades en un mismo tablero.

import { generarPuzzle } from '../sudoku/generador.js';
import { lienzoDeForma } from './formas.js';

// `pistasPorGrilla`: un número para todas, o un arreglo con una por grilla.
// Devuelve { puzzle, solucion }.
export function generarMultiSudoku({ cantidad, pistasPorGrilla }) {
  return generarPuzzle(pistasPorGrilla, { lienzo: lienzoDeForma(cantidad) });
}
