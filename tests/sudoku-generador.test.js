import { describe, expect, it } from 'vitest';
import { generarPuzzle, generarSolucion } from '../src/game/sudoku/generador.js';
import { contarSoluciones } from '../src/game/sudoku/resolvedor.js';
import { LIENZO_9X9, celdaEnDireccion } from '../src/game/sudoku/lienzo.js';
import { DIGITOS, crearTableroVacio } from '../src/game/sudoku/tablero.js';
import { DIFICULTADES, limitarPistasPersonalizado } from '../src/game/sudoku/dificultades.js';
import { CANTIDADES, lienzoDeForma } from '../src/game/multisudoku/formas.js';
import { generarMultiSudoku } from '../src/game/multisudoku/generador.js';

// Cada fila, columna y caja de cada grilla tiene los 9 dígitos.
function esSolucionValida(tablero, lienzo) {
  return lienzo.grupos.every((grupo) => {
    const valores = grupo.map((indice) => tablero[indice]).sort();
    return valores.join('') === DIGITOS.join('');
  });
}

function pistasPorGrilla(puzzle, lienzo) {
  const pistas = new Array(lienzo.cantidadGrillas).fill(0);
  for (const indice of lienzo.celdas) {
    if (puzzle[indice] === 0) continue;
    for (const { grilla } of lienzo.ubicaciones[indice]) pistas[grilla]++;
  }
  return pistas;
}

describe('lienzo', () => {
  it('un 9x9 tiene 81 celdas y cada una 20 vecinas', () => {
    expect(LIENZO_9X9.celdas).toHaveLength(81);
    expect(LIENZO_9X9.vecinos.every((vecinas) => vecinas.length === 20)).toBe(true);
  });

  it('las formas multi tienen las celdas esperadas (cada caja compartida resta 9)', () => {
    expect(lienzoDeForma(2).celdas).toHaveLength(2 * 81 - 9);
    expect(lienzoDeForma(3).celdas).toHaveLength(3 * 81 - 2 * 9);
    expect(lienzoDeForma(4).celdas).toHaveLength(4 * 81 - 4 * 9);
    expect(lienzoDeForma(5).celdas).toHaveLength(5 * 81 - 4 * 9);
  });

  it('las flechas saltan los huecos del multi sudoku', () => {
    const lienzo = lienzoDeForma(2); // 15x15, la segunda grilla empieza en (6, 6)
    const finDeLaPrimeraFila = 8; // fila 0, columna 8
    expect(celdaEnDireccion(lienzo, finDeLaPrimeraFila, 'ArrowRight')).toBe(finDeLaPrimeraFila);
    const bordeSuperiorDeLaSegunda = 6 * 15 + 12; // arriba solo hay hueco
    expect(celdaEnDireccion(lienzo, bordeSuperiorDeLaSegunda, 'ArrowUp')).toBe(bordeSuperiorDeLaSegunda);
    const pegadaALaPrimera = 8 * 15 + 8; // fila 8, columna 8: la caja compartida
    expect(celdaEnDireccion(lienzo, pegadaALaPrimera, 'ArrowRight')).toBe(8 * 15 + 9);
  });
});

describe('generarSolucion', () => {
  it('arma un 9x9 completo y válido', () => {
    expect(esSolucionValida(generarSolucion(), LIENZO_9X9)).toBe(true);
  });

  it('respeta las celdas fijas', () => {
    const fijas = crearTableroVacio();
    fijas[0] = 5;
    fijas[40] = 3;

    const solucion = generarSolucion(LIENZO_9X9, fijas);

    expect(solucion[0]).toBe(5);
    expect(solucion[40]).toBe(3);
    expect(esSolucionValida(solucion, LIENZO_9X9)).toBe(true);
  });
});

describe('generarPuzzle (9x9)', () => {
  for (const [id, { pistas }] of Object.entries(DIFICULTADES)) {
    it(`${id}: solución única, coherente y con unas ${pistas} pistas`, () => {
      const { puzzle, solucion } = generarPuzzle(pistas);

      expect(contarSoluciones(puzzle, LIENZO_9X9).soluciones).toBe(1);
      puzzle.forEach((valor, indice) => {
        if (valor !== 0) expect(valor).toBe(solucion[indice]);
      });
      const [pistasFinales] = pistasPorGrilla(puzzle, LIENZO_9X9);
      expect(pistasFinales).toBeGreaterThanOrEqual(pistas);
      expect(pistasFinales).toBeLessThanOrEqual(pistas + 4);
    });
  }

  it('nunca vacía las celdas fijas', () => {
    const fijas = crearTableroVacio();
    [0, 1, 2, 9, 10, 11, 18, 19, 20].forEach((indice, i) => {
      fijas[indice] = i + 1;
    });

    const { puzzle } = generarPuzzle(26, { fijas });

    expect(puzzle.slice(0, 3)).toEqual([1, 2, 3]);
    expect(puzzle.slice(9, 12)).toEqual([4, 5, 6]);
    expect(puzzle.slice(18, 21)).toEqual([7, 8, 9]);
  });
});

describe('generarMultiSudoku', () => {
  for (const cantidad of CANTIDADES) {
    // Una celda compartida que se vacía resta pistas a sus dos grillas, así
    // que una grilla puede quedar unas pocas por debajo del objetivo.
    it(`${cantidad} tableros en difícil: válido, único y cerca de las pistas pedidas`, () => {
      const lienzo = lienzoDeForma(cantidad);
      const { puzzle, solucion } = generarMultiSudoku({ cantidad, pistasPorGrilla: 26 });

      expect(esSolucionValida(solucion, lienzo)).toBe(true);
      expect(contarSoluciones(puzzle, lienzo).soluciones).toBe(1);
      for (const pistas of pistasPorGrilla(puzzle, lienzo)) {
        expect(pistas).toBeGreaterThanOrEqual(22);
        expect(pistas).toBeLessThanOrEqual(32);
      }
    });
  }

  it('acepta una cantidad de pistas distinta por grilla', () => {
    const lienzo = lienzoDeForma(2);
    const { puzzle } = generarMultiSudoku({ cantidad: 2, pistasPorGrilla: [45, 26] });
    const [primera, segunda] = pistasPorGrilla(puzzle, lienzo);
    expect(primera).toBeGreaterThan(segunda);
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
