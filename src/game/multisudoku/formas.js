// Las formas del multi sudoku: de 2 a 5 grillas de 9x9 donde cada dos
// vecinas comparten una caja de 3x3 completa.
//
// `origenes` es la esquina superior izquierda de cada grilla dentro del
// lienzo (ver game/sudoku/lienzo.js). Moverse 6 filas o columnas deja a
// la grilla siguiente encima de la última caja de la anterior.

import { crearLienzo } from '../sudoku/lienzo.js';

export const FORMAS = {
  2: {
    nombre: 'Diagonal',
    descripcion: 'Dos tableros conectados por una sola esquina.',
    origenes: [
      { fila: 0, columna: 0 },
      { fila: 6, columna: 6 },
    ],
  },
  3: {
    nombre: 'Forma de V',
    descripcion: 'Dos tableros arriba y uno abajo conectando a los dos.',
    origenes: [
      { fila: 0, columna: 0 },
      { fila: 0, columna: 12 },
      { fila: 6, columna: 6 },
    ],
  },
  4: {
    nombre: 'Círculo',
    descripcion: 'Cuatro tableros en anillo, cada uno conectado al siguiente.',
    origenes: [
      { fila: 0, columna: 6 },
      { fila: 6, columna: 12 },
      { fila: 12, columna: 6 },
      { fila: 6, columna: 0 },
    ],
  },
  5: {
    nombre: 'Forma de X',
    descripcion: 'Un tablero central y cuatro en las esquinas (el Samurai clásico).',
    origenes: [
      { fila: 0, columna: 0 },
      { fila: 0, columna: 12 },
      { fila: 6, columna: 6 },
      { fila: 12, columna: 0 },
      { fila: 12, columna: 12 },
    ],
  },
};

export const CANTIDADES = Object.keys(FORMAS).map(Number);

export function lienzoDeForma(cantidad) {
  return crearLienzo(FORMAS[cantidad].origenes);
}
