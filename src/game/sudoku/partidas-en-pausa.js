// Partidas de sudoku en pausa y sudokus completados, guardados en el
// archivo de guardado (ver save/guardado.js).
//
// Una partida nueva NO se guarda sola: vive en memoria hasta que el
// jugador presiona "Pausar y guardar". Puede haber como máximo
// MAXIMO_PARTIDAS_EN_PAUSA a la vez.
//
// Cómo queda una partida en el guardado:
//   {
//     id, dificultad, politicaErrores,
//     tableroInicial, tableroActual, solucion,   textos de 81 dígitos
//     notas: ['', '137', ...],                   81 textos con los dígitos anotados
//     segundos, errores,
//     yaContadas: [4, 17],                       ver PartidaSudoku.yaContadas
//     creada, actualizada                        fechas ISO
//   }

import { modificarGuardado, obtenerGuardado } from '../../save/guardado.js';
import { PartidaSudoku } from './partida.js';
import { tableroATexto, textoATablero } from './tablero.js';

export const MAXIMO_PARTIDAS_EN_PAUSA = 3;

function crearId() {
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/* ---------- Conversión partida <-> guardado ---------- */

export function partidaAGuardar(partida) {
  return {
    dificultad: partida.dificultad,
    politicaErrores: partida.politicaErrores,
    tableroInicial: tableroATexto(partida.tableroInicial),
    tableroActual: tableroATexto(partida.tablero),
    solucion: tableroATexto(partida.solucion),
    notas: partida.notas.map((digitos) => [...digitos].sort().join('')),
    segundos: partida.segundos,
    errores: partida.errores,
    yaContadas: [...partida.yaContadas],
  };
}

export function partidaDesdeGuardada(guardada) {
  return new PartidaSudoku({
    dificultad: guardada.dificultad,
    politicaErrores: guardada.politicaErrores,
    tableroInicial: textoATablero(guardada.tableroInicial),
    tableroActual: textoATablero(guardada.tableroActual),
    solucion: textoATablero(guardada.solucion),
    notas: (guardada.notas ?? []).map((texto) => [...texto].map(Number)),
    segundos: guardada.segundos ?? 0,
    errores: guardada.errores ?? 0,
    yaContadas: guardada.yaContadas ?? [],
  });
}

/* ---------- Partidas en pausa ---------- */

// Las más recientes primero.
export function listarPartidasEnPausa() {
  return [...obtenerGuardado().partidasEnPausa].sort((a, b) => b.actualizada.localeCompare(a.actualizada));
}

export function obtenerPartidaEnPausa(id) {
  return obtenerGuardado().partidasEnPausa.find((guardada) => guardada.id === id) ?? null;
}

// Guarda la partida. Con `id` actualiza esa partida en pausa (se había
// retomado); sin `id` ocupa un lugar nuevo. Devuelve el id, o lanza un
// Error si ya no queda lugar.
export async function pausarPartida(partida, id = null) {
  const datos = partidaAGuardar(partida);
  const ahora = new Date().toISOString();

  return modificarGuardado((guardado) => {
    const existente = id && guardado.partidasEnPausa.find((guardada) => guardada.id === id);
    if (existente) {
      Object.assign(existente, datos, { actualizada: ahora });
      return existente.id;
    }

    if (guardado.partidasEnPausa.length >= MAXIMO_PARTIDAS_EN_PAUSA) {
      throw new Error(`Ya tienes ${MAXIMO_PARTIDAS_EN_PAUSA} partidas en pausa. Elimina una desde el menú para guardar otra.`);
    }
    const nueva = { id: crearId(), ...datos, creada: ahora, actualizada: ahora };
    guardado.partidasEnPausa.push(nueva);
    return nueva.id;
  });
}

export async function eliminarPartidaEnPausa(id) {
  await modificarGuardado((guardado) => {
    guardado.partidasEnPausa = guardado.partidasEnPausa.filter((guardada) => guardada.id !== id);
  });
}

/* ---------- Sudokus completados ---------- */

export async function registrarSudokuCompletado(dificultad) {
  await modificarGuardado((guardado) => {
    const completados = guardado.estadisticas.sudokusCompletados;
    completados[dificultad] = (completados[dificultad] ?? 0) + 1;
  });
}

export function totalSudokusCompletados() {
  const completados = obtenerGuardado().estadisticas.sudokusCompletados;
  return Object.values(completados).reduce((suma, cantidad) => suma + cantidad, 0);
}
