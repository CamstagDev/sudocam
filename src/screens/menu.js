import { navegar } from '../router.js';
import { VERSION_APP } from '../version.js';
import { elegirDificultadSudoku } from '../ui/selector-dificultad.js';
import { elegirMultiSudoku } from '../ui/selector-multisudoku.js';
import { TEXTO_LIMITE_PARTIDAS, dibujarPartidasEnPausa } from '../ui/lista-partidas-en-pausa.js';
import { ultimosLogros } from '../game/logros/logros.js';
import { ORDEN_JEFES } from '../game/jefes/catalogo.js';
import { crearCartaJefe } from '../ui/carta-jefe.js';

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

// Los juegos piden sus opciones antes de empezar; el resto abre directo.
const SELECTORES = {
  sudoku: elegirDificultadSudoku,
  multisudoku: elegirMultiSudoku,
};

async function abrirJuego(ruta) {
  const elegirOpciones = SELECTORES[ruta];
  if (!elegirOpciones) {
    navegar(ruta);
    return;
  }
  const eleccion = await elegirOpciones();
  if (eleccion) navegar(ruta, eleccion);
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
        <div class="game-grid" id="jefes"></div>
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

    const grillaJefes = contenedor.querySelector('#jefes');
    ORDEN_JEFES.forEach((id) => grillaJefes.appendChild(crearCartaJefe(id)));

    dibujarPartidasEnPausa(contenedor.querySelector('#partidas-en-pausa'));
  },
};
