import { navegar } from '../router.js';
import { VERSION_APP } from '../version.js';

// Jefes en el orden en que se desbloquean. Por ahora todos aparecen
// bloqueados: el desbloqueo real llega con el sistema de guardado y los
// logros (pasos 7 y 12 del plan).
const JEFES = [
  { id: 'uriel', pista: 'Completa un sudoku fácil para desbloquear a este jefe' },
  { id: 'hecate', pista: 'Vence a Uriel y completa un sudoku medio para desbloquear a esta jefa' },
  { id: 'jormungandr', pista: 'Vence a Hecate y completa un sudoku difícil para desbloquear a este jefe' },
  { id: 'babel', pista: 'Vence a Jörmungandr para desbloquear a este jefe' },
  { id: 'typhon', pista: 'Vence a Jörmungandr para desbloquear a este jefe' },
];

const JUEGOS = [
  { ruta: 'sudoku', icono: '🔢', titulo: 'Sudoku 9x9', desc: 'El clásico rompecabezas de números' },
  { ruta: 'multisudoku', icono: '🧬', titulo: 'Multi Sudoku', desc: 'Varios tableros de 9x9 entrelazados por sus cajas de las esquinas' },
];

const OPCIONES = [
  { ruta: 'logros', icono: '🏆', titulo: 'Logros' },
  { ruta: 'personalizacion', icono: '🎨', titulo: 'Personalización' },
  { ruta: 'guardado', icono: '💾', titulo: 'Datos de guardado' },
];

function cartaJuego({ ruta, icono, titulo, desc }) {
  return `
    <button type="button" class="game-card" data-ruta="${ruta}">
      <span class="game-card-icon">${icono}</span>
      <span class="game-card-title">${titulo}</span>
      <span class="game-card-desc">${desc}</span>
    </button>
  `;
}

function cartaJefeBloqueado({ id, pista }) {
  return `
    <div class="game-card bloqueada" data-jefe="${id}">
      <span class="game-card-icon">🔒</span>
      <span class="game-card-title">???</span>
      <span class="game-card-desc">${pista}</span>
    </div>
  `;
}

function botonOpcion({ ruta, icono, titulo }) {
  return `
    <button type="button" class="opcion-menu" data-ruta="${ruta}">
      <span class="opcion-menu-icono">${icono}</span>
      <span>${titulo}</span>
    </button>
  `;
}

export const pantallaMenu = {
  titulo: 'Menú',
  subtitulo: 'Elige a qué jugar',
  render(contenedor) {
    contenedor.innerHTML = `
      <section class="menu-seccion">
        <h2 class="section-title">Juegos</h2>
        <div class="game-grid">${JUEGOS.map(cartaJuego).join('')}</div>
      </section>

      <section class="menu-seccion">
        <h2 class="section-title">Jefes</h2>
        <div class="game-grid">${JEFES.map(cartaJefeBloqueado).join('')}</div>
      </section>

      <section class="card">
        <h2 class="section-title">Partidas guardadas</h2>
        <p class="field-hint">Puedes tener hasta 3 partidas de sudoku en pausa a la vez.</p>
        <div class="empty-state">Todavía no tienes partidas en pausa.</div>
      </section>

      <nav class="opciones-menu" aria-label="Opciones">${OPCIONES.map(botonOpcion).join('')}</nav>

      <p class="version-app">SudoCam v${VERSION_APP}</p>
    `;

    contenedor.querySelectorAll('[data-ruta]').forEach((boton) => {
      boton.addEventListener('click', () => navegar(boton.dataset.ruta));
    });
  },
};
