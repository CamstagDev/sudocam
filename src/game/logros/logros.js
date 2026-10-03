// Desbloqueo de logros.
//
// Las reglas de cada familia de logros son funciones puras que, dado el
// guardado, dicen qué logros corresponden; desbloquearLogros() anota los
// que todavía no estaban y devuelve esos (para mostrar el aviso).

import { modificarGuardado, obtenerGuardado } from '../../save/guardado.js';
import { CATALOGO, buscarLogro } from './catalogo.js';

/* ---------- Reglas ---------- */

// Logros que corresponden después de completar un sudoku normal de
// `dificultad` (el contador del guardado ya incluye este sudoku).
export function logrosPorSudokus(guardado, dificultad) {
  const completados = guardado.estadisticas.sudokusCompletados;
  const total = Object.values(completados).reduce((suma, n) => suma + n, 0);

  const ids = [];
  if (total >= 1) ids.push('primer_sudoku');
  if (total >= 5) ids.push('sudokus_5');
  if (total >= 10) ids.push('sudokus_10');
  if (total >= 100) ids.push('sudokus_100');
  if (['facil', 'medio', 'dificil'].includes(dificultad)) ids.push(`sudoku_${dificultad}`);
  return ids;
}

/* ---------- Estado ---------- */

export function estaDesbloqueado(id) {
  return Boolean(obtenerGuardado().logros[id]);
}

// Anota como ganados los `ids` que todavía no lo estaban. Devuelve los
// recién ganados, con sus datos del catálogo.
export async function desbloquearLogros(ids) {
  const fecha = new Date().toISOString();
  const nuevos = await modificarGuardado((guardado) => {
    const recienGanados = ids.filter((id) => buscarLogro(id) && !guardado.logros[id]);
    recienGanados.forEach((id) => {
      guardado.logros[id] = fecha;
    });
    return recienGanados;
  });
  return nuevos.map(buscarLogro);
}

// El catálogo con el estado del jugador, para la pantalla de Logros.
export function logrosConEstado() {
  const guardado = obtenerGuardado();
  return CATALOGO.map((logro) => {
    const fecha = guardado.logros[logro.id] ?? null;
    const progreso = !fecha && logro.progreso ? logro.progreso(guardado) : null;
    return {
      ...logro,
      desbloqueado: Boolean(fecha),
      fecha,
      progreso: progreso && { actual: Math.min(progreso.actual, progreso.objetivo), objetivo: progreso.objetivo },
    };
  });
}

// Los últimos `cantidad` logros ganados, del más reciente al más viejo.
export function ultimosLogros(cantidad) {
  return logrosConEstado()
    .filter((logro) => logro.desbloqueado)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, cantidad);
}
