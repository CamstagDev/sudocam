// Pantalla del Multi Sudoku: de 2 a 5 tableros de 9x9 entrelazados.
//
//   #/multisudoku?dificultad=medio&cantidad=5
//
// El tablero se genera en un hilo aparte (ver en-segundo-plano.js) y
// mientras tanto se muestra un aviso; el juego en sí es el mismo
// ui/juego-sudoku.js del sudoku normal.

import { navegar } from '../router.js';
import { DIFICULTADES } from '../game/sudoku/dificultades.js';
import { PartidaSudoku } from '../game/sudoku/partida.js';
import { CANTIDADES, FORMAS, lienzoDeForma } from '../game/multisudoku/formas.js';
import { generarEnSegundoPlano } from '../game/multisudoku/en-segundo-plano.js';
import { registrarSudokuGanado } from '../game/progreso.js';
import { leerPreferencias } from '../preferencias.js';
import { crearJuegoSudoku } from '../ui/juego-sudoku.js';
import { crearTarjetaVictoria } from '../ui/tarjeta-victoria.js';
import { mostrarLogrosNuevos } from '../ui/aviso-logro.js';

const DIFICULTADES_MULTI = ['facil', 'medio', 'dificil'];

function leerConfiguracion(params) {
  const dificultad = DIFICULTADES_MULTI.includes(params.get('dificultad')) ? params.get('dificultad') : 'medio';
  const cantidad = CANTIDADES.includes(Number(params.get('cantidad'))) ? Number(params.get('cantidad')) : 2;
  return { dificultad, cantidad };
}

let juego = null;
let pantallaActiva = 0; // para ignorar un tablero que termina de generarse después de salir

export const pantallaMultiSudoku = {
  titulo: 'Multi Sudoku',
  subtitulo: (params) => {
    const { dificultad, cantidad } = leerConfiguracion(params);
    return `${cantidad} tableros (${FORMAS[cantidad].nombre}) · ${DIFICULTADES[dificultad].nombre}`;
  },

  async render(contenedor, params) {
    const { dificultad, cantidad } = leerConfiguracion(params);
    const estaVisita = ++pantallaActiva;

    contenedor.innerHTML = `
      <div class="card generando">
        <span class="generando-icono">🧬</span>
        <p>Generando el tablero…</p>
      </div>
    `;

    const { puzzle, solucion } = await generarEnSegundoPlano({ cantidad, pistasPorGrilla: DIFICULTADES[dificultad].pistas });
    if (estaVisita !== pantallaActiva) return; // el jugador ya se fue de esta pantalla

    const partida = new PartidaSudoku({
      dificultad,
      politicaErrores: DIFICULTADES[dificultad].politicaErrores,
      tableroInicial: puzzle,
      solucion,
      lienzo: lienzoDeForma(cantidad),
    });

    contenedor.replaceChildren();
    juego = crearJuegoSudoku(contenedor, {
      partida,
      preferencias: leerPreferencias(),
      insignias: [DIFICULTADES[dificultad].nombre, `${cantidad} tableros`],
      alGanar: async (segundos) => {
        victoria.mostrar(segundos);
        mostrarLogrosNuevos(await registrarSudokuGanado(dificultad));
      },
    });

    const victoria = crearTarjetaVictoria(contenedor, {
      titulo: '¡Multi Sudoku resuelto!',
      alJugarOtraVez: () => navegar('multisudoku', { dificultad, cantidad }),
    });
  },

  destruir() {
    pantallaActiva++;
    juego?.destruir();
    juego = null;
  },
};
