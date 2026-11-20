// Pantalla del sudoku 9x9 clásico.
//
// Qué partida jugar llega por la ruta:
//   #/sudoku?dificultad=medio                                     partida nueva
//   #/sudoku?dificultad=personalizado&pistas=30&politicaErrores=boton
//   #/sudoku?partida=<id>                                         retomar una en pausa
//
// El juego en sí (tablero, teclado, notas...) es ui/juego-sudoku.js; esta
// pantalla agrega lo propio del 9x9: elegir la partida, pausar y guardar,
// y qué pasa al ganar.

import { RUTA_INICIO, navegar } from '../router.js';
import { DIFICULTADES, POLITICAS_ERRORES, limitarPistasPersonalizado } from '../game/sudoku/dificultades.js';
import { generarPuzzle } from '../game/sudoku/generador.js';
import { PartidaSudoku } from '../game/sudoku/partida.js';
import {
  eliminarPartidaEnPausa,
  obtenerPartidaEnPausa,
  partidaDesdeGuardada,
  pausarPartida,
} from '../game/sudoku/partidas-en-pausa.js';
import { registrarSudokuGanado } from '../game/progreso.js';
import { leerPreferencias } from '../preferencias.js';
import { crearJuegoSudoku } from '../ui/juego-sudoku.js';
import { crearTarjetaVictoria } from '../ui/tarjeta-victoria.js';
import { mostrarLogrosNuevos } from '../ui/aviso-logro.js';

// Traduce los parámetros de la ruta a una configuración válida, sin
// confiar en lo que venga (alguien podría escribir la URL a mano).
function leerConfiguracion(params) {
  const dificultad = DIFICULTADES[params.get('dificultad')] ? params.get('dificultad') : 'medio';
  if (dificultad !== 'personalizado') {
    return { dificultad, ...DIFICULTADES[dificultad] };
  }
  const politica = params.get('politicaErrores');
  return {
    dificultad,
    pistas: limitarPistasPersonalizado(Number(params.get('pistas'))),
    politicaErrores: POLITICAS_ERRORES[politica] ? politica : DIFICULTADES.personalizado.politicaErrores,
  };
}

function crearPartidaNueva({ dificultad, pistas, politicaErrores }) {
  const { puzzle, solucion } = generarPuzzle(pistas);
  return new PartidaSudoku({ dificultad, politicaErrores, tableroInicial: puzzle, solucion });
}

// La partida a jugar según la ruta: la que estaba en pausa, o una nueva.
// `idEnPausa` es null si la partida todavía no se guardó nunca.
function cargarPartida(params) {
  const guardada = params.has('partida') ? obtenerPartidaEnPausa(params.get('partida')) : null;
  if (guardada) {
    return { partida: partidaDesdeGuardada(guardada), idEnPausa: guardada.id, noEncontrada: false };
  }
  return {
    partida: crearPartidaNueva(leerConfiguracion(params)),
    idEnPausa: null,
    noEncontrada: params.has('partida'),
  };
}

// Los parámetros para empezar otra partida igual a `partida`.
function configuracionParaRepetir(partida) {
  if (partida.dificultad !== 'personalizado') return { dificultad: partida.dificultad };
  return { dificultad: 'personalizado', pistas: partida.cantidadPistas, politicaErrores: partida.politicaErrores };
}

function nombreDificultad(params) {
  const guardada = params.has('partida') ? obtenerPartidaEnPausa(params.get('partida')) : null;
  const dificultad = guardada ? guardada.dificultad : leerConfiguracion(params).dificultad;
  return DIFICULTADES[dificultad].nombre;
}

let juego = null;

export const pantallaSudoku = {
  titulo: 'Sudoku 9x9',
  subtitulo: (params) => `Dificultad: ${nombreDificultad(params)}`,

  render(contenedor, params) {
    const cargada = cargarPartida(params);
    const { partida } = cargada;
    let idEnPausa = cargada.idEnPausa;

    async function pausarYGuardar() {
      juego.detenerCronometro();
      try {
        idEnPausa = await pausarPartida(partida, idEnPausa);
        navegar(RUTA_INICIO);
      } catch (error) {
        juego.mostrarMensaje(error.message, 'error');
        juego.reanudarCronometro();
      }
    }

    async function alGanar(segundos) {
      victoria.mostrar(segundos);
      // Una partida ganada ya no tiene sentido en pausa: libera el lugar.
      if (idEnPausa) await eliminarPartidaEnPausa(idEnPausa);
      mostrarLogrosNuevos(await registrarSudokuGanado(partida.dificultad, { segundos }));
    }

    juego = crearJuegoSudoku(contenedor, {
      partida,
      preferencias: leerPreferencias(),
      insignias: [DIFICULTADES[partida.dificultad].nombre],
      accionesExtra: [{ texto: '⏸ Pausar y guardar', alTocar: pausarYGuardar }],
      alGanar,
    });

    const victoria = crearTarjetaVictoria(contenedor, {
      titulo: '¡Sudoku resuelto!',
      alJugarOtraVez: () => navegar('sudoku', configuracionParaRepetir(partida)),
    });

    if (cargada.noEncontrada) {
      juego.mostrarMensaje('No se encontró esa partida en pausa, así que empezó una nueva.', 'error');
    }
  },

  destruir() {
    juego?.destruir();
    juego = null;
  },
};
