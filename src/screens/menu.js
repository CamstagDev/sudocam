import { RUTA_INICIO, navegar } from '../router.js';
import { VERSION_APP } from '../version.js';
import { elegirDificultadSudoku } from '../ui/selector-dificultad.js';
import { elegirMultiSudoku } from '../ui/selector-multisudoku.js';
import { TEXTO_LIMITE_PARTIDAS, dibujarPartidasEnPausa } from '../ui/lista-partidas-en-pausa.js';
import { tituloDeModo } from '../ui/modos.js';
import { crearCarruselJuegos } from '../ui/carrusel-juegos.js';
import { ponerIlustracion } from '../ui/ilustracion.js';

// Cada juego con su ilustración (public/img/cartas/<ruta>.jpg, 3:4; se
// prepara con scripts/preparar-imagen-jefe.ps1). La ilustración ya trae el
// nombre, así que el texto queda solo para los lectores de pantalla.
const JUEGOS = [
  { ruta: 'sudoku', titulo: 'Sudoku 9x9', desc: 'El clásico rompecabezas de números' },
  { ruta: 'multisudoku', titulo: 'Multi Sudoku', desc: 'Varios tableros de 9x9 entrelazados por sus cajas de las esquinas' },
  { ruta: 'tutorial', titulo: 'Tutorial', desc: 'Aprende a resolver un sudoku paso a paso' },
];

function cartaJuego({ ruta, titulo, desc }) {
  const carta = document.createElement('button');
  carta.type = 'button';
  carta.className = 'game-card carta-juego';
  ponerIlustracion(carta, `./img/cartas/${ruta}.jpg`);
  carta.innerHTML = '<span class="solo-lectores"></span>';
  carta.querySelector('.solo-lectores').textContent = `${titulo}: ${desc}`;
  return carta;
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
        <!-- En PC, las tres cartas en una fila; en el teléfono, un carrusel. -->
        <div class="game-grid solo-pc" data-id="grilla-juegos"></div>
        <div class="solo-movil" data-id="carrusel-juegos"></div>
      </section>

      <section class="card">
        <h2 class="section-title">Partidas guardadas</h2>
        <p class="campo-ayuda tarjeta-ayuda">${TEXTO_LIMITE_PARTIDAS}</p>
        <div id="partidas-en-pausa"></div>
      </section>

      <p class="version-app">SudoCam v${VERSION_APP}</p>
    `;

    const grilla = contenedor.querySelector('[data-id="grilla-juegos"]');
    JUEGOS.forEach((juego) => {
      const carta = cartaJuego(juego);
      carta.addEventListener('click', () => abrirJuego(juego.ruta));
      grilla.appendChild(carta);
    });
    contenedor.querySelector('[data-id="carrusel-juegos"]').appendChild(crearCarruselJuegos(JUEGOS, {
      crearCarta: cartaJuego,
      alElegir: (juego) => abrirJuego(juego.ruta),
    }));

    dibujarPartidasEnPausa(contenedor.querySelector('#partidas-en-pausa'));
  },
};
