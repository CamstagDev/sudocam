import { describe, expect, it } from 'vitest';
import { PASOS_TUTORIAL, PUZZLE_TUTORIAL, SOLUCION_TUTORIAL } from '../src/game/tutorial/leccion.js';
import { contarSoluciones } from '../src/game/sudoku/resolvedor.js';
import { LIENZO_9X9 } from '../src/game/sudoku/lienzo.js';
import { CAJAS } from '../src/game/sudoku/geometria-9x9.js';
import { DIGITOS } from '../src/game/sudoku/tablero.js';

// Números que todavía pueden ir en `indice`.
function candidatos(tablero, indice) {
  const usados = new Set(LIENZO_9X9.vecinos[indice].map((vecina) => tablero[vecina]));
  return DIGITOS.filter((digito) => !usados.has(digito));
}

// El tablero tal como lo ve el jugador al llegar a cada paso: los
// ejemplos anteriores ya resueltos.
function tablerosPorPaso() {
  const tablero = [...PUZZLE_TUTORIAL];
  return PASOS_TUTORIAL.map((paso) => {
    const antes = [...tablero];
    if (paso.objetivo) tablero[paso.objetivo.celda] = paso.objetivo.digito;
    return antes;
  });
}

describe('tutorial', () => {
  it('el sudoku tiene una sola solución, la guardada', () => {
    expect(contarSoluciones(PUZZLE_TUTORIAL, LIENZO_9X9).soluciones).toBe(1);
    PUZZLE_TUTORIAL.forEach((valor, indice) => {
      if (valor !== 0) expect(SOLUCION_TUTORIAL[indice]).toBe(valor);
    });
  });

  it('cada ejemplo pide el número correcto en una celda vacía', () => {
    const tableros = tablerosPorPaso();
    PASOS_TUTORIAL.forEach((paso, i) => {
      if (!paso.objetivo) return;
      const { celda, digito } = paso.objetivo;
      expect(tableros[i][celda]).toBe(0);
      expect(SOLUCION_TUTORIAL[celda]).toBe(digito);
      expect(paso.ayuda && paso.alAcertar).toBeTruthy();
    });
  });

  it('en los ejemplos 1 y 2 la zona tiene una sola celda vacía', () => {
    const tableros = tablerosPorPaso();
    for (const i of [4, 5]) {
      const { zona, objetivo } = PASOS_TUTORIAL[i];
      expect(zona.filter((indice) => tableros[i][indice] === 0)).toEqual([objetivo.celda]);
    }
  });

  it('en el barrido, la celda es el único lugar de la caja para ese número, aunque admita otros', () => {
    const i = PASOS_TUTORIAL.findIndex((paso) => paso.titulo.includes('barrido'));
    const tablero = tablerosPorPaso()[i];
    const { objetivo, pistas } = PASOS_TUTORIAL[i];
    const caja = CAJAS.find((c) => c.includes(objetivo.celda));
    const lugares = caja.filter((indice) => tablero[indice] === 0 && candidatos(tablero, indice).includes(objetivo.digito));
    expect(lugares).toEqual([objetivo.celda]);
    expect(candidatos(tablero, objetivo.celda).length).toBeGreaterThan(1);
    pistas.forEach((indice) => expect(tablero[indice]).toBe(objetivo.digito));
  });

  it('en el candidato único, la celda solo admite ese número', () => {
    const i = PASOS_TUTORIAL.findIndex((paso) => paso.titulo.includes('candidato'));
    const { objetivo } = PASOS_TUTORIAL[i];
    expect(candidatos(tablerosPorPaso()[i], objetivo.celda)).toEqual([objetivo.digito]);
  });

  it('después de la parte guiada queda bastante para resolver solo', () => {
    const ultimo = tablerosPorPaso().at(-1);
    expect(ultimo.filter((valor) => valor === 0).length).toBeGreaterThanOrEqual(25);
  });
});
