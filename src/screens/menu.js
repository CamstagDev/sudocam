import { navegar } from '../router.js';
import { VERSION_APP } from '../version.js';
import { elegirDificultadSudoku } from '../ui/selector-dificultad.js';
import { elegirMultiSudoku } from '../ui/selector-multisudoku.js';
import { TEXTO_LIMITE_PARTIDAS, dibujarPartidasEnPausa } from '../ui/lista-partidas-en-pausa.js';
import { ultimosLogros } from '../game/logros/logros.js';
import { ORDEN_JEFES } from '../game/jefes/catalogo.js';
import { jefeDesbloqueado } from '../game/jefes/registro.js';
import { crearCarruselJefes } from '../ui/carrusel-jefes.js';

const JUEGOS = [
  { ruta: 'sudoku', icono: '🔢', titulo: 'Sudoku 9x9', desc: 'El clásico rompecabezas de números' },
  { ruta: 'multisudoku', icono: '🧬', titulo: 'Multi Sudoku', desc: 'Varios tableros de 9x9 entrelazados por sus cajas de las esquinas' },
  { ruta: 'tutorial', icono: '🎓', titulo: 'Tutorial', desc: 'Aprende a resolver un sudoku paso a paso' },
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

// Solo los jefes ya desbloqueados: los demás no se insinúan de ninguna
// forma. Sin ninguno, la sección "Jefes" entera no aparece.
function seccionDeJefes() {
  const desbloqueados = ORDEN_JEFES.filter((id) => jefeDesbloqueado(id));
  if (desbloqueados.length === 0) return null;

  const seccion = document.createElement('section');
  seccion.className = 'menu-seccion';
  // El título va centrado sobre el carrusel (más adelante, una imagen).
  seccion.innerHTML = '<h2 class="section-title titulo-jefes">Jefes</h2>';
  seccion.appendChild(crearCarruselJefes(desbloqueados));
  return seccion;
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

      <div id="jefes"></div>

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

    const jefes = seccionDeJefes();
    const lugarDeJefes = contenedor.querySelector('#jefes');
    if (jefes) lugarDeJefes.replaceWith(jefes);
    else lugarDeJefes.remove();

    dibujarPartidasEnPausa(contenedor.querySelector('#partidas-en-pausa'));
  },
};
