import { beforeEach, describe, expect, it } from 'vitest';
import { crearAlmacenEnMemoria } from '../src/save/almacen-navegador.js';
import { iniciarGuardado, obtenerGuardado } from '../src/save/guardado.js';
import { crearGuardadoNuevo, normalizarGuardado } from '../src/save/formato.js';
import {
  MODO_SUDOKU,
  anotarTiempo,
  filasDeJefes,
  filasDeTiempos,
  modoMulti,
  modosMultiJugados,
} from '../src/game/estadisticas.js';
import { registrarSudokuGanado } from '../src/game/progreso.js';

describe('estadísticas: tiempos', () => {
  it('lleva partidas, mejor tiempo y promedio por modo y dificultad', () => {
    const guardado = crearGuardadoNuevo();
    anotarTiempo(guardado, { modo: MODO_SUDOKU, dificultad: 'facil', segundos: 300 });
    anotarTiempo(guardado, { modo: MODO_SUDOKU, dificultad: 'facil', segundos: 200 });
    guardado.estadisticas.sudokusCompletados.facil = 2;

    expect(filasDeTiempos(guardado, MODO_SUDOKU)).toEqual([
      { dificultad: 'facil', nombre: 'Fácil', completados: 2, conTiempo: 2, mejor: 200, promedio: 250 },
    ]);
  });

  it('ignora tiempos que no son números', () => {
    const guardado = crearGuardadoNuevo();
    anotarTiempo(guardado, { modo: MODO_SUDOKU, dificultad: 'medio', segundos: NaN });
    expect(guardado.estadisticas.tiempos).toEqual({});
  });

  it('los multi sudokus van aparte, ordenados por cantidad de tableros', () => {
    const guardado = crearGuardadoNuevo();
    anotarTiempo(guardado, { modo: modoMulti(5), dificultad: 'dificil', segundos: 1800 });
    anotarTiempo(guardado, { modo: modoMulti(2), dificultad: 'medio', segundos: 600 });
    expect(modosMultiJugados(guardado)).toEqual(['multi2', 'multi5']);
    expect(filasDeTiempos(guardado, 'multi5')[0]).toMatchObject({ completados: 1, mejor: 1800 });
    expect(filasDeTiempos(guardado, MODO_SUDOKU)).toEqual([]);
  });
});

describe('estadísticas: guardados viejos', () => {
  it('un guardado sin "tiempos" se carga con los tiempos vacíos y conserva los completados', () => {
    const viejo = crearGuardadoNuevo();
    delete viejo.estadisticas.tiempos;
    viejo.estadisticas.sudokusCompletados.dificil = 4;

    const cargado = normalizarGuardado(JSON.parse(JSON.stringify(viejo)));
    expect(cargado.estadisticas.tiempos).toEqual({});
    expect(filasDeTiempos(cargado, MODO_SUDOKU)).toEqual([
      { dificultad: 'dificil', nombre: 'Difícil', completados: 4, conTiempo: 0, mejor: null, promedio: null },
    ]);
  });
});

describe('estadísticas: al ganar', () => {
  beforeEach(async () => {
    await iniciarGuardado(crearAlmacenEnMemoria());
  });

  it('registrarSudokuGanado suma el completado y anota el tiempo', async () => {
    await registrarSudokuGanado('medio', { segundos: 420 });
    await registrarSudokuGanado('medio', { segundos: 380, modo: modoMulti(3) });
    const guardado = obtenerGuardado();
    expect(guardado.estadisticas.sudokusCompletados.medio).toBe(2);
    expect(guardado.estadisticas.tiempos.sudoku.medio).toEqual({ partidas: 1, total: 420, mejor: 420 });
    expect(guardado.estadisticas.tiempos.multi3.medio).toEqual({ partidas: 1, total: 380, mejor: 380 });
  });

  it('los jefes bloqueados no aparecen', () => {
    expect(filasDeJefes(obtenerGuardado())).toEqual([]);
  });

  it('un jefe desbloqueado aparece con sus marcas', () => {
    const guardado = obtenerGuardado();
    guardado.logros.sudoku_facil = new Date().toISOString();
    guardado.jefes.uriel = {
      victorias: 2, mejorTiempo: 190, victoriasRapidas: 1, mejorMarca: { errores: 1, segundos: 190 },
    };
    expect(filasDeJefes(guardado)).toEqual([
      { id: 'uriel', nombre: 'Uriel', victorias: 2, mejorTiempo: 190, victoriasRapidas: 1, menosErrores: 1 },
    ]);
  });
});
