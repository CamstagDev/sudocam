// Resumen legible de un guardado: lo muestra la pantalla "Datos de
// guardado" para el progreso actual y para un archivo antes de importarlo.
//
// Como el resto del juego, no delata jefes bloqueados en ese guardado:
// los logros cuentan solo los visibles y "Jefes vencidos" no aparece
// mientras no haya ningún jefe desbloqueado.

import { hayJefesDesbloqueados } from '../game/jefes/registro.js';
import { logrosVisibles } from '../game/logros/visibles.js';

export function resumirGuardado(guardado) {
  const completados = guardado.estadisticas.sudokusCompletados;
  const visibles = logrosVisibles(guardado);
  return {
    logros: visibles.filter((logro) => guardado.logros[logro.id]).length,
    totalLogros: visibles.length,
    sudokusCompletados: Object.values(completados).reduce((suma, n) => suma + n, 0),
    partidasEnPausa: guardado.partidasEnPausa.length,
    hayJefes: hayJefesDesbloqueados(guardado),
    jefesVencidos: Object.values(guardado.jefes).filter((jefe) => (jefe?.victorias ?? 0) > 0).length,
    creado: guardado.creado,
    actualizado: guardado.actualizado,
    appVersion: guardado.appVersion,
  };
}

function formatearFecha(iso) {
  return new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Las filas "etiqueta: valor" que se muestran en pantalla.
export function filasDelResumen(resumen) {
  return [
    ['Logros', `${resumen.logros} de ${resumen.totalLogros}`],
    ['Sudokus completados', String(resumen.sudokusCompletados)],
    resumen.hayJefes && ['Jefes vencidos', String(resumen.jefesVencidos)],
    ['Partidas en pausa', String(resumen.partidasEnPausa)],
    ['Empezado', formatearFecha(resumen.creado)],
    ['Última vez guardado', formatearFecha(resumen.actualizado)],
    ['Versión del juego', resumen.appVersion],
  ].filter(Boolean);
}
