import { describe, expect, it } from 'vitest';
import { PartidaSudoku } from '../src/game/sudoku/partida.js';

// Una solución fija y un puzzle al que solo le faltan las celdas 0, 1 y 80.
const SOLUCION = [
  5, 3, 4, 6, 7, 8, 9, 1, 2,
  6, 7, 2, 1, 9, 5, 3, 4, 8,
  1, 9, 8, 3, 4, 2, 5, 6, 7,
  8, 5, 9, 7, 6, 1, 4, 2, 3,
  4, 2, 6, 8, 5, 3, 7, 9, 1,
  7, 1, 3, 9, 2, 4, 8, 5, 6,
  9, 6, 1, 5, 3, 7, 2, 8, 4,
  2, 8, 7, 4, 1, 9, 6, 3, 5,
  3, 4, 5, 2, 8, 6, 1, 7, 9,
];
const PUZZLE = SOLUCION.map((valor, indice) => ([0, 1, 80].includes(indice) ? 0 : valor));

function nuevaPartida(politicaErrores) {
  return new PartidaSudoku({ dificultad: 'medio', politicaErrores, tableroInicial: PUZZLE, solucion: SOLUCION });
}

describe('PartidaSudoku', () => {
  it('no deja tocar las celdas fijas', () => {
    const partida = nuevaPartida('instantaneo');
    expect(partida.colocar(2, 9)).toBe(false);
    expect(partida.tablero[2]).toBe(4);
  });

  it('instantaneo: marca el error apenas se escribe', () => {
    const partida = nuevaPartida('instantaneo');
    partida.colocar(0, 9);
    expect([...partida.erroresVisibles]).toEqual([0]);
  });

  it('boton: no muestra errores hasta comprobar, y los oculta tras la siguiente jugada', () => {
    const partida = nuevaPartida('boton');
    partida.colocar(0, 9);
    expect(partida.erroresVisibles.size).toBe(0);
    expect(partida.erroresRevisados).toBe(false);

    partida.comprobar();
    expect([...partida.erroresVisibles]).toEqual([0]);

    partida.colocar(1, 3);
    expect(partida.erroresVisibles.size).toBe(0);
  });

  it('final: revisa solo cuando el tablero se llena', () => {
    const partida = nuevaPartida('final');
    partida.colocar(0, 9);
    partida.colocar(1, 3);
    expect(partida.erroresVisibles.size).toBe(0);

    partida.colocar(80, 9);
    expect([...partida.erroresVisibles]).toEqual([0]);
    expect(partida.resuelta).toBe(false);
  });

  it('el contador de errores nunca baja al corregir', () => {
    const partida = nuevaPartida('instantaneo');
    partida.colocar(0, 9);
    expect(partida.errores).toBe(1);

    partida.borrar(0);
    expect(partida.errores).toBe(1);

    partida.colocar(0, 8); // otro error en la misma celda: cuenta aparte
    expect(partida.errores).toBe(2);

    partida.colocar(1, 3); // jugada correcta: no cambia nada
    expect(partida.errores).toBe(2);
  });

  it('boton: un error cuenta al comprobar, y una sola vez', () => {
    const partida = nuevaPartida('boton');
    partida.colocar(0, 9);
    expect(partida.errores).toBe(0);

    partida.comprobar();
    partida.comprobar();
    expect(partida.errores).toBe(1);

    partida.colocar(0, 5); // lo corrige: el error ya cometido se queda
    partida.comprobar();
    expect(partida.errores).toBe(1);
  });

  it('detecta la victoria y bloquea jugadas posteriores', () => {
    const partida = nuevaPartida('instantaneo');
    partida.colocar(0, 5);
    partida.colocar(1, 3);
    partida.colocar(80, 9);
    expect(partida.resuelta).toBe(true);
    expect(partida.borrar(0)).toBe(false);
  });

  it('las notas solo van en celdas vacías y se limpian al escribir', () => {
    const partida = nuevaPartida('instantaneo');
    partida.alternarNota(0, 1);
    partida.alternarNota(0, 5);
    partida.alternarNota(0, 1);
    expect([...partida.notas[0]]).toEqual([5]);

    partida.colocar(0, 5);
    expect(partida.notas[0].size).toBe(0);
    expect(partida.alternarNota(0, 2)).toBe(false);
  });

  it('borrar en una celda vacía limpia sus notas', () => {
    const partida = nuevaPartida('instantaneo');
    partida.alternarNota(1, 3);
    partida.borrar(1);
    expect(partida.notas[1].size).toBe(0);
  });
});
