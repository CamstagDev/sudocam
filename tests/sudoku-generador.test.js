import { describe, expect, it } from 'vitest';
import { contarSoluciones, generarPuzzle, generarSolucion } from '../src/game/sudoku/generador.js';
import {
  DIGITOS,
  crearTableroVacio,
  indicesDeCaja,
  indicesDeColumna,
  indicesDeFila,
} from '../src/game/sudoku/tablero.js';
import { DIFICULTADES, limitarPistasPersonalizado } from '../src/game/sudoku/dificultades.js';

const ESQUINAS_DE_CAJA = [0, 3, 6, 27, 30, 33, 54, 57, 60];

function tieneLosNueveDigitos(tablero, indices) {
  const valores = indices.map((indice) => tablero[indice]).sort();
  return valores.join('') === DIGITOS.join('');
}

function esSolucionValida(tablero) {
  for (let n = 0; n < 9; n++) {
    if (!tieneLosNueveDigitos(tablero, indicesDeFila(n))) return false;
    if (!tieneLosNueveDigitos(tablero, indicesDeColumna(n))) return false;
  }
  return ESQUINAS_DE_CAJA.every((esquina) => tieneLosNueveDigitos(tablero, indicesDeCaja(esquina)));
}

function contarPistas(puzzle) {
  return puzzle.filter((valor) => valor !== 0).length;
}

describe('generarSolucion', () => {
  it('arma un tablero completo y válido', () => {
    expect(esSolucionValida(generarSolucion())).toBe(true);
  });

  it('respeta las celdas fijas', () => {
    const fijas = crearTableroVacio();
    fijas[0] = 5;
    fijas[40] = 3;

    const solucion = generarSolucion(fijas);

    expect(solucion[0]).toBe(5);
    expect(solucion[40]).toBe(3);
    expect(esSolucionValida(solucion)).toBe(true);
  });
});

describe('generarPuzzle', () => {
  for (const [id, { pistas }] of Object.entries(DIFICULTADES)) {
    it(`${id}: solución única, coherente y con unas ${pistas} pistas`, () => {
      const { puzzle, solucion } = generarPuzzle(pistas);

      expect(contarSoluciones(puzzle)).toBe(1);
      puzzle.forEach((valor, indice) => {
        if (valor !== 0) expect(valor).toBe(solucion[indice]);
      });
      expect(contarPistas(puzzle)).toBeGreaterThanOrEqual(pistas);
      expect(contarPistas(puzzle)).toBeLessThanOrEqual(pistas + 4);
    });
  }

  it('nunca vacía las celdas fijas', () => {
    const fijas = crearTableroVacio();
    [0, 1, 2, 9, 10, 11, 18, 19, 20].forEach((indice, i) => {
      fijas[indice] = i + 1;
    });

    const { puzzle } = generarPuzzle(26, fijas);

    expect(puzzle.slice(0, 3)).toEqual([1, 2, 3]);
    expect(puzzle.slice(9, 12)).toEqual([4, 5, 6]);
    expect(puzzle.slice(18, 21)).toEqual([7, 8, 9]);
  });
});

describe('limitarPistasPersonalizado', () => {
  it('mantiene las pistas dentro de los límites', () => {
    expect(limitarPistasPersonalizado(5)).toBe(22);
    expect(limitarPistasPersonalizado(80)).toBe(55);
    expect(limitarPistasPersonalizado(30)).toBe(30);
    expect(limitarPistasPersonalizado(Number.NaN)).toBe(32);
  });
});
