// Lo que el guardado recuerda de cada jefe, y las reglas de desbloqueo.
//
// En el guardado (guardado.jefes), una entrada por jefe:
//   uriel: {
//     victorias: 4,
//     mejorTiempo: 190,           segundos, o null si nunca ganó
//     victoriasRapidas: 1,        ganadas en menos de SEGUNDOS_VICTORIA_RAPIDA
//     mejorMarca: { errores, segundos, usoNotas, fecha }
//   }
// "Mejor marca" es la mejor partida: primero menos errores y, si empatan,
// menos tiempo.

import { modificarGuardado, obtenerGuardado } from '../../save/guardado.js';
import { JEFES, SECCIONES_INFORMACION, SEGUNDOS_VICTORIA_RAPIDA } from './catalogo.js';
import { JEFES_NORMALES } from '../logros/catalogo.js';
import { desbloquearLogros, estaDesbloqueado } from '../logros/logros.js';

const SIN_ESTADISTICAS = { victorias: 0, mejorTiempo: null, victoriasRapidas: 0, mejorMarca: null };

export function estadisticasDeJefe(id, guardado = obtenerGuardado()) {
  return { ...SIN_ESTADISTICAS, ...guardado.jefes[id] };
}

function esMejorMarca(nueva, anterior) {
  if (!anterior) return true;
  if (nueva.errores !== anterior.errores) return nueva.errores < anterior.errores;
  return nueva.segundos < anterior.segundos;
}

/* ---------- Logros ---------- */

// Logros que corresponden al ganarle a `jefe` (normal o uber). `extra`
// trae datos de la pelea que solo sirven para los logros "perfectos":
//   errores, puntosJefe (Uriel), alcanzoFase2 (Jörmungandr),
//   dificultadElegida (Babel).
export function logrosPorJefe(guardado, jefe, extra = {}) {
  const ids = [];
  const logroPorVictoria = {
    uriel: 'uriel_derrotado',
    hecate: 'hecate_derrotada',
    jormungandr: 'jormungandr_derrotado',
    typhon: 'typhon_derrotado',
    uriel_uber: 'uriel_uber_derrotado',
    hecate_uber: 'hecate_uber_derrotada',
    jormungandr_uber: 'jormungandr_uber_derrotado',
    babel_uber: 'babel_uber_derrotado',
    typhon_uber: 'typhon_uber_derrotado',
  };
  if (logroPorVictoria[jefe]) ids.push(logroPorVictoria[jefe]);

  if (jefe.startsWith('uriel') && extra.puntosJefe === 0) ids.push('uriel_aleteo_mariposa');
  if (jefe.startsWith('hecate') && extra.errores === 0) ids.push('hecate_sin_pasiva');
  if (jefe.startsWith('jormungandr') && extra.alcanzoFase2 === false) ids.push('jormungandr_hambruna');
  if (jefe.startsWith('typhon') && extra.errores === 0) ids.push('typhon_ojo_de_la_tormenta');
  // Babel no tiene un logro fijo: depende de la dificultad elegida.
  if (jefe === 'babel' && extra.dificultadElegida) ids.push(`babel_derrotado_${extra.dificultadElegida}`);

  const todosVencidos = JEFES_NORMALES.every((normal) => estadisticasDeJefe(normal, guardado).victorias > 0);
  if (todosVencidos) ids.push('todos_los_jefes');

  return ids;
}

/* ---------- Registrar una victoria ---------- */

// Anota la victoria en el guardado y desbloquea los logros que
// correspondan. Devuelve los logros recién ganados.
export async function registrarVictoriaDeJefe(jefe, { segundos, errores, usoNotas, ...extra }) {
  const guardado = await modificarGuardado((g) => {
    const anterior = estadisticasDeJefe(jefe, g);
    const marca = { errores, segundos, usoNotas, fecha: new Date().toISOString() };
    g.jefes[jefe] = {
      victorias: anterior.victorias + 1,
      mejorTiempo: anterior.mejorTiempo === null ? segundos : Math.min(anterior.mejorTiempo, segundos),
      victoriasRapidas: anterior.victoriasRapidas + (segundos < SEGUNDOS_VICTORIA_RAPIDA ? 1 : 0),
      mejorMarca: esMejorMarca(marca, anterior.mejorMarca) ? marca : anterior.mejorMarca,
    };
    return g;
  });
  return desbloquearLogros(logrosPorJefe(guardado, jefe, { errores, ...extra }));
}

/* ---------- Desbloqueos ---------- */

// Las tres secciones de su página de información desbloqueadas.
export function estaCompletamenteInvestigado(id) {
  const jefe = JEFES[id];
  const stats = estadisticasDeJefe(id);
  return SECCIONES_INFORMACION.every((seccion) => !jefe[seccion] || jefe[seccion].seDesbloqueaCon(stats));
}

const haVencidoA = (id) => estadisticasDeJefe(id).victorias > 0;

// Qué hace falta para enfrentar a cada jefe. Los normales piden vencer al
// anterior y, los tres primeros, haber completado un sudoku de esa
// dificultad por tu cuenta. Los uber piden investigar por completo a su
// versión normal (Babel: vencerlo en difícil).
const REQUISITOS = {
  uriel: () => estaDesbloqueado('sudoku_facil'),
  hecate: () => haVencidoA('uriel') && estaDesbloqueado('sudoku_medio'),
  jormungandr: () => haVencidoA('hecate') && estaDesbloqueado('sudoku_dificil'),
  babel: () => haVencidoA('jormungandr'),
  typhon: () => haVencidoA('jormungandr'),
  uriel_uber: () => estaCompletamenteInvestigado('uriel'),
  hecate_uber: () => estaCompletamenteInvestigado('hecate'),
  jormungandr_uber: () => estaCompletamenteInvestigado('jormungandr'),
  babel_uber: () => estaDesbloqueado('babel_derrotado_dificil'),
  typhon_uber: () => estaCompletamenteInvestigado('typhon'),
};

export function jefeDesbloqueado(id) {
  return Boolean(REQUISITOS[id]?.());
}

// Texto para la carta bloqueada del menú.
export const PISTAS_DE_DESBLOQUEO = {
  uriel: 'Completa un sudoku fácil para desbloquear a este jefe',
  hecate: 'Vence a Uriel y completa un sudoku medio para desbloquear a esta jefa',
  jormungandr: 'Vence a Hecate y completa un sudoku difícil para desbloquear a este jefe',
  babel: 'Vence a Jörmungandr para desbloquear a este jefe',
  typhon: 'Vence a Jörmungandr para desbloquear a este jefe',
};
