import { beforeEach, describe, expect, it } from 'vitest';
import { crearAlmacenEnMemoria } from '../src/save/almacen-navegador.js';
import { iniciarGuardado, obtenerGuardado } from '../src/save/guardado.js';
import { PartidaSudoku } from '../src/game/sudoku/partida.js';
import { generarPuzzle } from '../src/game/sudoku/generador.js';
import {
  eliminarPartidaEnPausa,
  listarPartidasEnPausa,
  obtenerPartidaEnPausa,
  partidaDesdeGuardada,
  pausarPartida,
  registrarSudokuCompletado,
  totalSudokusCompletados,
} from '../src/game/sudoku/partidas-en-pausa.js';

function partidaNueva() {
  const { puzzle, solucion } = generarPuzzle(40);
  return new PartidaSudoku({ dificultad: 'facil', politicaErrores: 'instantaneo', tableroInicial: puzzle, solucion });
}

beforeEach(async () => {
  await iniciarGuardado(crearAlmacenEnMemoria());
});

describe('partidas en pausa', () => {
  it('al retomar, la partida queda igual que al pausarla', async () => {
    const partida = partidaNueva();
    const vacia = partida.tablero.indexOf(0);
    const otraVacia = partida.tablero.indexOf(0, vacia + 1);
    const incorrecto = partida.solucion[vacia] === 9 ? 8 : 9;
    partida.colocar(vacia, incorrecto);
    partida.alternarNota(otraVacia, 2);
    partida.alternarNota(otraVacia, 7);
    partida.segundos = 95;

    const id = await pausarPartida(partida);
    const retomada = partidaDesdeGuardada(obtenerPartidaEnPausa(id));

    expect(retomada.tablero).toEqual(partida.tablero);
    expect(retomada.tableroInicial).toEqual(partida.tableroInicial);
    expect([...retomada.notas[otraVacia]]).toEqual([2, 7]);
    expect(retomada.segundos).toBe(95);
    expect(retomada.errores).toBe(1);

    // El error que ya estaba contado no se vuelve a contar al retomar.
    retomada.comprobar();
    expect(retomada.errores).toBe(1);
  });

  it('volver a pausar una partida retomada la actualiza en vez de duplicarla', async () => {
    const partida = partidaNueva();
    const id = await pausarPartida(partida);
    partida.segundos = 10;

    expect(await pausarPartida(partida, id)).toBe(id);
    expect(listarPartidasEnPausa()).toHaveLength(1);
    expect(obtenerPartidaEnPausa(id).segundos).toBe(10);
  });

  it('no deja pasar de 3 partidas en pausa', async () => {
    await pausarPartida(partidaNueva());
    await pausarPartida(partidaNueva());
    await pausarPartida(partidaNueva());

    await expect(pausarPartida(partidaNueva())).rejects.toThrow('Ya tienes 3 partidas en pausa');
    expect(obtenerGuardado().partidasEnPausa).toHaveLength(3);
  });

  it('eliminar libera el lugar', async () => {
    const id = await pausarPartida(partidaNueva());
    await eliminarPartidaEnPausa(id);
    expect(listarPartidasEnPausa()).toHaveLength(0);
  });
});

describe('sudokus completados', () => {
  it('cuenta por dificultad y en total', async () => {
    await registrarSudokuCompletado('facil');
    await registrarSudokuCompletado('facil');
    await registrarSudokuCompletado('dificil');

    expect(obtenerGuardado().estadisticas.sudokusCompletados.facil).toBe(2);
    expect(totalSudokusCompletados()).toBe(3);
  });
});
