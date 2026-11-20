// Pantalla de Estadísticas: sudokus completados con sus tiempos (mejor y
// promedio) por dificultad, los multi sudokus por cantidad de tableros, y
// lo que llevas contra cada jefe desbloqueado. Solo lee el guardado (ver
// game/estadisticas.js).

import {
  MODO_SUDOKU,
  filasDeJefes,
  filasDeTiempos,
  modosMultiJugados,
  totalCompletados,
} from '../game/estadisticas.js';
import { SEGUNDOS_VICTORIA_RAPIDA } from '../game/jefes/catalogo.js';
import { obtenerGuardado } from '../save/guardado.js';
import { formatearSegundos } from '../ui/cronometro.js';

const tiempo = (segundos) => (segundos === null ? '—' : formatearSegundos(segundos));

function tablaDeTiempos(filas) {
  return `
    <div class="tabla-estadisticas-marco">
      <table class="tabla-estadisticas">
        <thead>
          <tr><th>Dificultad</th><th>Completados</th><th>Mejor</th><th>Promedio</th></tr>
        </thead>
        <tbody>
          ${filas.map((fila) => `
            <tr>
              <th scope="row">${fila.nombre}</th>
              <td>${fila.completados}</td>
              <td>${tiempo(fila.mejor)}</td>
              <td>${tiempo(fila.promedio)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function tarjetaSudoku(guardado) {
  const filas = filasDeTiempos(guardado, MODO_SUDOKU);
  const sinTiempo = filas.some((fila) => fila.completados > fila.conTiempo);
  return `
    <section class="card">
      <h2 class="section-title">Sudoku</h2>
      ${filas.length === 0
        ? '<p class="campo-ayuda">Todavía no has completado ningún sudoku.</p>'
        : tablaDeTiempos(filas)}
      ${sinTiempo ? `
        <p class="campo-ayuda tarjeta-ayuda">
          "Completados" suma los sudokus 9x9 y los multi sudokus. El mejor tiempo y el
          promedio son solo del 9x9, y no cuentan las partidas ganadas antes de la
          versión 0.6, que no guardaron su tiempo.
        </p>` : ''}
    </section>
  `;
}

function tarjetaMultiSudoku(guardado) {
  const modos = modosMultiJugados(guardado);
  if (modos.length === 0) return '';
  return `
    <section class="card">
      <h2 class="section-title">Multi Sudoku</h2>
      ${modos.map((modo) => `
        <h3 class="subtitulo-tarjeta">${modo.slice(5)} tableros</h3>
        ${tablaDeTiempos(filasDeTiempos(guardado, modo))}`).join('')}
    </section>
  `;
}

// Sin jefes desbloqueados no aparece (no delata que existen).
function tarjetaJefes(guardado) {
  const filas = filasDeJefes(guardado);
  if (filas.length === 0) return '';
  return `
    <section class="card">
      <h2 class="section-title">Jefes</h2>
      <div class="tabla-estadisticas-marco">
        <table class="tabla-estadisticas">
          <thead>
            <tr><th>Jefe</th><th>Ganadas</th><th>Mejor</th><th>Errores</th><th>Rápidas</th></tr>
          </thead>
          <tbody>
            ${filas.map((fila) => `
              <tr>
                <th scope="row">${fila.nombre}</th>
                <td>${fila.victorias}</td>
                <td>${tiempo(fila.mejorTiempo)}</td>
                <td>${fila.menosErrores ?? '—'}</td>
                <td>${fila.victoriasRapidas}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <p class="campo-ayuda tarjeta-ayuda">
        "Mejor": tu victoria más rápida. "Errores": los de tu mejor partida (la de menos
        errores). "Rápidas": victorias en menos de ${formatearSegundos(SEGUNDOS_VICTORIA_RAPIDA)}.
      </p>
    </section>
  `;
}

export const pantallaEstadisticas = {
  titulo: 'Estadísticas',
  subtitulo: () => {
    const total = totalCompletados();
    return `${total} ${total === 1 ? 'sudoku completado' : 'sudokus completados'}`;
  },

  render(contenedor) {
    const guardado = obtenerGuardado();
    contenedor.innerHTML = tarjetaSudoku(guardado) + tarjetaMultiSudoku(guardado) + tarjetaJefes(guardado);
  },
};
