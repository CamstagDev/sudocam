// Pantalla del tutorial: un sudoku muy fácil con un globo que explica,
// paso a paso, cómo se resuelve (ver game/tutorial/leccion.js). Los pasos
// con ejemplo resaltan celdas y esperan a que el jugador escriba el número
// correcto. Al terminar la parte guiada, el jugador completa el tablero
// solo y el globo deja lugar a una lista de consejos.
//
// En el teléfono el globo va encima del tablero y los consejos debajo; en
// PC los dos van en una columna al costado.

import { navegar } from '../router.js';
import { PartidaSudoku } from '../game/sudoku/partida.js';
import { PASOS_TUTORIAL, PUZZLE_TUTORIAL, SOLUCION_TUTORIAL } from '../game/tutorial/leccion.js';
import { CONSEJOS } from '../game/tutorial/consejos.js';
import { leerPreferencias } from '../preferencias.js';
import { crearJuegoSudoku } from '../ui/juego-sudoku.js';
import { crearTarjetaVictoria } from '../ui/tarjeta-victoria.js';

function crearPartidaTutorial() {
  return new PartidaSudoku({
    dificultad: 'facil',
    politicaErrores: 'instantaneo',
    tableroInicial: PUZZLE_TUTORIAL,
    solucion: SOLUCION_TUTORIAL,
  });
}

const HTML_GLOBO = `
  <div class="globo-tutorial-cabecera">
    <span class="globo-tutorial-contador"></span>
    <button type="button" class="btn-enlace" data-id="saltar">Saltar tutorial</button>
  </div>
  <h2 class="globo-tutorial-titulo"></h2>
  <p class="globo-tutorial-texto"></p>
  <p class="globo-tutorial-acierto hidden"></p>
  <button type="button" class="btn btn-primary btn-sm" data-id="siguiente">Siguiente</button>
`;

function htmlConsejos() {
  return `
    <h2 class="section-title">Consejos</h2>
    <ol class="lista-consejos">
      ${CONSEJOS.map(({ titulo, texto }) => `<li><strong>${titulo}</strong><span>${texto}</span></li>`).join('')}
    </ol>
  `;
}

let juego = null;

export const pantallaTutorial = {
  titulo: 'Tutorial',
  subtitulo: 'Aprende a resolver un sudoku',

  render(contenedor) {
    const partida = crearPartidaTutorial();
    let numeroPaso = 0;
    let acertado = false; // el jugador ya escribió el número del ejemplo actual
    let juegoLibre = false; // terminó la parte guiada

    const disposicion = document.createElement('div');
    disposicion.className = 'tutorial';
    disposicion.innerHTML = `
      <section class="card globo-tutorial" aria-live="polite">${HTML_GLOBO}</section>
      <div class="tutorial-juego"></div>
      <section class="card consejos-tutorial hidden">${htmlConsejos()}</section>
    `;
    contenedor.appendChild(disposicion);

    const globo = disposicion.querySelector('.globo-tutorial');
    const consejos = disposicion.querySelector('.consejos-tutorial');
    const parte = (selector) => globo.querySelector(selector);
    const pasoActual = () => PASOS_TUTORIAL[numeroPaso];

    /* ---------- Globo ---------- */

    function dibujarGlobo() {
      const paso = pasoActual();
      const esperaJugada = Boolean(paso.objetivo) && !acertado;
      const esUltimo = numeroPaso === PASOS_TUTORIAL.length - 1;

      parte('.globo-tutorial-contador').textContent = `Paso ${numeroPaso + 1} de ${PASOS_TUTORIAL.length}`;
      parte('.globo-tutorial-titulo').textContent = paso.titulo;
      parte('.globo-tutorial-texto').textContent = paso.texto;
      parte('.globo-tutorial-acierto').textContent = acertado ? `¡Bien! ${paso.alAcertar}` : '';
      parte('.globo-tutorial-acierto').classList.toggle('hidden', !acertado);
      parte('[data-id="siguiente"]').classList.toggle('hidden', esperaJugada);
      parte('[data-id="siguiente"]').textContent = esUltimo ? '¡A jugar!' : 'Siguiente';
    }

    function avanzar() {
      if (numeroPaso === PASOS_TUTORIAL.length - 1) {
        empezarJuegoLibre();
        return;
      }
      numeroPaso++;
      acertado = false;
      dibujarGlobo();
      // Sin selección, para que su fila/columna/caja no se mezcle con lo
      // que resalta el paso nuevo.
      juego.seleccionar(null);
    }

    function empezarJuegoLibre() {
      juegoLibre = true;
      globo.classList.add('hidden');
      consejos.classList.remove('hidden');
      juego.seleccionar(null);
    }

    /* ---------- Jugadas durante la parte guiada ---------- */

    function avisar(texto) {
      juego.mostrarMensaje(texto, 'error');
      return false;
    }

    // En la parte guiada solo vale escribir el número del ejemplo, en su
    // celda. Lo demás no se hace y se explica por qué.
    function puedeJugar({ indice, digito, notas }) {
      if (juegoLibre) return true;
      if (digito === 0) return false; // no hay nada que borrar: los errores no llegan a escribirse
      const { objetivo, ayuda } = pasoActual();
      if (!objetivo || acertado) return avisar('Lee el globo y toca "Siguiente" para seguir.');
      if (indice !== objetivo.celda) return avisar('En este paso, escribe en la celda que brilla.');
      if (notas) return avisar('Apaga ✏️ Notas para escribir el número.');
      if (digito !== objetivo.digito) return avisar(ayuda);
      return true;
    }

    function alJugar({ correcto }) {
      if (juegoLibre || !correcto) return;
      acertado = true;
      dibujarGlobo();
      juego.dibujar();
    }

    // Las celdas que el paso actual resalta (ver styles/tutorial.css).
    function marcas() {
      if (juegoLibre) return {};
      const { zona = [], lineas = [], pistas = [], objetivo } = pasoActual();
      return {
        'tuto-zona': new Set(zona),
        'tuto-linea': new Set(lineas),
        'tuto-pista': new Set(pistas),
        'tuto-objetivo': new Set(objetivo && !acertado ? [objetivo.celda] : []),
      };
    }

    /* ---------- Arranque ---------- */

    juego = crearJuegoSudoku(disposicion.querySelector('.tutorial-juego'), {
      partida,
      preferencias: leerPreferencias(),
      insignias: ['Tutorial'],
      mostrarCronometro: false,
      marcas,
      puedeJugar,
      alJugar,
      alGanar: () => victoria.mostrar(partida.segundos),
    });

    const victoria = crearTarjetaVictoria(contenedor, {
      titulo: '¡Tutorial completado!',
      textoOtraVez: 'Jugar un sudoku Fácil',
      alJugarOtraVez: () => navegar('sudoku', { dificultad: 'facil' }),
    });

    parte('[data-id="siguiente"]').addEventListener('click', avanzar);
    parte('[data-id="saltar"]').addEventListener('click', empezarJuegoLibre);
    dibujarGlobo();
  },

  destruir() {
    juego?.destruir();
    juego = null;
  },
};
