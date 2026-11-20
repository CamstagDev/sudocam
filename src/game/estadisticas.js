// Estadísticas del jugador: cuántos sudokus completó, sus tiempos y lo que
// lleva contra cada jefe. La pantalla está en screens/estadisticas.js.
//
// En el guardado:
//   estadisticas.sudokusCompletados: { facil: 3, medio: 1, ... }   (desde 0.1)
//   estadisticas.tiempos: {                                          (desde 0.6)
//     sudoku:  { facil: { partidas: 3, total: 812, mejor: 201 }, ... },
//     multi3:  { medio: { ... } },          multi sudoku de 3 tableros
//   }
// Los guardados de antes de 0.6 no tienen `tiempos`: sus partidas cuentan
// como completadas pero no tienen tiempo, por eso el promedio se saca solo
// de las partidas con tiempo.

import { modificarGuardado, obtenerGuardado } from '../save/guardado.js';
import { DIFICULTADES } from './sudoku/dificultades.js';
import { JEFES, ORDEN_JEFES } from './jefes/catalogo.js';
import { estadisticasDeJefe, jefeDesbloqueado } from './jefes/registro.js';

export const MODO_SUDOKU = 'sudoku';
export const modoMulti = (cantidad) => `multi${cantidad}`;

/* ---------- Escribir ---------- */

// Suma una partida ganada a los tiempos de su modo y dificultad (cambia
// `guardado`; se usa dentro de modificarGuardado).
export function anotarTiempo(guardado, { modo, dificultad, segundos }) {
  if (!Number.isFinite(segundos) || segundos < 0) return;
  const tiempos = (guardado.estadisticas.tiempos ??= {});
  const delModo = (tiempos[modo] ??= {});
  const anterior = delModo[dificultad] ?? { partidas: 0, total: 0, mejor: null };
  delModo[dificultad] = {
    partidas: anterior.partidas + 1,
    total: anterior.total + segundos,
    mejor: anterior.mejor === null ? segundos : Math.min(anterior.mejor, segundos),
  };
}

export async function registrarTiempo(datos) {
  await modificarGuardado((guardado) => anotarTiempo(guardado, datos));
}

/* ---------- Leer ---------- */

// Una fila por dificultad con algo jugado: completados (todos, con o sin
// tiempo), mejor tiempo y promedio (null si no hay tiempos).
export function filasDeTiempos(guardado, modo) {
  const delModo = guardado.estadisticas.tiempos?.[modo] ?? {};
  const completados = modo === MODO_SUDOKU ? guardado.estadisticas.sudokusCompletados : {};
  return Object.keys(DIFICULTADES)
    .map((dificultad) => {
      const tiempos = delModo[dificultad];
      return {
        dificultad,
        nombre: DIFICULTADES[dificultad].nombre,
        // Los contadores viejos no separan 9x9 de multi: para el multi se
        // cuentan solo las partidas con tiempo.
        completados: modo === MODO_SUDOKU ? (completados[dificultad] ?? 0) : (tiempos?.partidas ?? 0),
        conTiempo: tiempos?.partidas ?? 0,
        mejor: tiempos?.mejor ?? null,
        promedio: tiempos?.partidas ? Math.round(tiempos.total / tiempos.partidas) : null,
      };
    })
    .filter((fila) => fila.completados > 0 || fila.conTiempo > 0);
}

// Modos de multi sudoku con algún tiempo guardado, en orden (multi2...).
export function modosMultiJugados(guardado) {
  return Object.keys(guardado.estadisticas.tiempos ?? {})
    .filter((modo) => /^multi\d+$/.test(modo))
    .sort((a, b) => Number(a.slice(5)) - Number(b.slice(5)));
}

// Una fila por jefe desbloqueado (los bloqueados no existen para el
// jugador), normales primero y luego los uber.
export function filasDeJefes(guardado) {
  const ids = [...ORDEN_JEFES, ...ORDEN_JEFES.map((id) => `${id}_uber`)];
  return ids
    .filter((id) => JEFES[id] && jefeDesbloqueado(id, guardado))
    .map((id) => {
      const stats = estadisticasDeJefe(id, guardado);
      return {
        id,
        nombre: JEFES[id].nombre,
        victorias: stats.victorias,
        mejorTiempo: stats.mejorTiempo,
        victoriasRapidas: stats.victoriasRapidas,
        menosErrores: stats.mejorMarca?.errores ?? null,
      };
    });
}

export function totalCompletados(guardado = obtenerGuardado()) {
  return Object.values(guardado.estadisticas.sudokusCompletados).reduce((suma, n) => suma + n, 0);
}
