import { navegar } from '../router.js';
import { VERSION_APP } from '../version.js';
import { elegirDificultadSudoku } from '../ui/selector-dificultad.js';
import { TEXTO_LIMITE_PARTIDAS, dibujarPartidasEnPausa } from '../ui/lista-partidas-en-pausa.js';
import { ultimosLogros } from '../game/logros/logros.js';

// Jefes en el orden en que se desbloquean. Por ahora todos aparecen
// bloqueados: el desbloqueo real llega con los logros (paso 12 del plan).
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

// Vitrina con los últimos logros ganados; no aparece hasta ganar el primero.
function vitrinaDeLogros() {
  const ultimos = ultimosLogros(6);
  if (ultimos.length === 0) return '';
  return `
    <button type="button" class="card vitrina-logros" data-ruta="logros">
      <span class="cabecera-tarjeta">
        <span class="section-title">Últimos logros</span>
        <span class="vitrina-logros-ver">Ver todos →</span>
      </span>
      <span class="vitrina-logros-iconos">
        ${ultimos.map((logro) => `<span class="vitrina-logros-icono" title="${logro.nombre}">${logro.icono}</span>`).join('')}
      </span>
    </button>
  `;
}

// El sudoku pide la dificultad antes de empezar; el resto abre directo.
async function abrirJuego(ruta) {
  if (ruta !== 'sudoku') {
    navegar(ruta);
    return;
  }
  const eleccion = await elegirDificultadSudoku();
  if (eleccion) navegar('sudoku', eleccion);
}

export const pantallaMenu = {
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

      ${vitrinaDeLogros()}

      <section class="card">
        <h2 class="section-title">Partidas guardadas</h2>
        <p class="campo-ayuda tarjeta-ayuda">${TEXTO_LIMITE_PARTIDAS}</p>
        <div id="partidas-en-pausa"></div>
      </section>

      <p class="version-app">SudoCam v${VERSION_APP}</p>
    `;

    contenedor.querySelectorAll('[data-ruta]').forEach((boton) => {
      boton.addEventListener('click', () => abrirJuego(boton.dataset.ruta));
    });

    dibujarPartidasEnPausa(contenedor.querySelector('#partidas-en-pausa'));
  },
};
