import { RUTA_INICIO, navegar } from '../router.js';
import { VERSION_APP } from '../version.js';
import { elegirDificultadSudoku } from '../ui/selector-dificultad.js';
import { elegirMultiSudoku } from '../ui/selector-multisudoku.js';
import { TEXTO_LIMITE_PARTIDAS, dibujarPartidasEnPausa } from '../ui/lista-partidas-en-pausa.js';
import { tituloDeModo } from '../ui/modos.js';

// Cada juego con su ilustración (public/img/cartas/<ruta>.jpg, 3:4; se
// prepara con scripts/preparar-imagen-jefe.ps1). La ilustración ya trae el
// nombre, así que el texto queda solo para los lectores de pantalla.
const JUEGOS = [
  { ruta: 'sudoku', titulo: 'Sudoku 9x9', desc: 'El clásico rompecabezas de números' },
  { ruta: 'multisudoku', titulo: 'Multi Sudoku', desc: 'Varios tableros de 9x9 entrelazados por sus cajas de las esquinas' },
  { ruta: 'tutorial', titulo: 'Tutorial', desc: 'Aprende a resolver un sudoku paso a paso' },
];

function cartaJuego({ ruta, titulo, desc }) {
  return `
    <button type="button" class="game-card carta-juego" data-ruta="${ruta}"
      style="--ilustracion: url('./img/cartas/${ruta}.jpg')">
      <span class="solo-lectores">${titulo}: ${desc}</span>
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
        ${tituloDeModo(RUTA_INICIO)}
        <div class="game-grid">${JUEGOS.map(cartaJuego).join('')}</div>
      </section>

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
