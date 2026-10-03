import { beforeEach, describe, expect, it } from 'vitest';
import { crearAlmacenEnMemoria } from '../src/save/almacen-navegador.js';
import { iniciarGuardado, obtenerGuardado } from '../src/save/guardado.js';
import { CATALOGO } from '../src/game/logros/catalogo.js';
import {
  desbloquearLogros,
  estaDesbloqueado,
  logrosConEstado,
  logrosPorSudokus,
  ultimosLogros,
} from '../src/game/logros/logros.js';
import { registrarSudokuCompletado } from '../src/game/sudoku/partidas-en-pausa.js';

beforeEach(async () => {
  await iniciarGuardado(crearAlmacenEnMemoria());
});

describe('catálogo', () => {
  it('no repite ids', () => {
    const ids = CATALOGO.map((logro) => logro.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('logrosPorSudokus', () => {
  it('el primer sudoku fácil da "primer_sudoku" y "sudoku_facil"', async () => {
    await registrarSudokuCompletado('facil');
    expect(logrosPorSudokus(obtenerGuardado(), 'facil')).toEqual(['primer_sudoku', 'sudoku_facil']);
  });

  it('el quinto sudoku da "sudokus_5"; personalizado no da logro de dificultad', async () => {
    for (let i = 0; i < 5; i++) await registrarSudokuCompletado('personalizado');
    expect(logrosPorSudokus(obtenerGuardado(), 'personalizado')).toEqual(['primer_sudoku', 'sudokus_5']);
  });
});

describe('desbloquearLogros', () => {
  it('devuelve solo los recién ganados y los anota con fecha', async () => {
    const primeros = await desbloquearLogros(['primer_sudoku', 'sudoku_facil']);
    expect(primeros.map((logro) => logro.id)).toEqual(['primer_sudoku', 'sudoku_facil']);

    const segunda = await desbloquearLogros(['primer_sudoku', 'sudoku_medio']);
    expect(segunda.map((logro) => logro.id)).toEqual(['sudoku_medio']);
    expect(estaDesbloqueado('primer_sudoku')).toBe(true);
  });

  it('ignora ids que no existen en el catálogo', async () => {
    expect(await desbloquearLogros(['no_existe'])).toEqual([]);
    expect(obtenerGuardado().logros).toEqual({});
  });
});

describe('logrosConEstado', () => {
  it('muestra el progreso de los logros por cantidad mientras están bloqueados', async () => {
    for (let i = 0; i < 3; i++) await registrarSudokuCompletado('medio');
    const sudokus10 = logrosConEstado().find((logro) => logro.id === 'sudokus_10');
    expect(sudokus10.progreso).toEqual({ actual: 3, objetivo: 10 });
  });

  it('los últimos logros salen del más reciente al más viejo', async () => {
    obtenerGuardado().logros = { primer_sudoku: '2026-10-01T00:00:00Z', sudoku_facil: '2026-10-02T00:00:00Z' };
    expect(ultimosLogros(6).map((logro) => logro.id)).toEqual(['sudoku_facil', 'primer_sudoku']);
  });
});
