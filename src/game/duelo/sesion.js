// Un duelo entre dos teléfonos, sobre una conexión cualquiera (ver
// transportes/memoria.js para lo que es una conexión). Aquí no hay
// pantalla: la pantalla (screens/duelo.js) escucha los eventos y llama a
// `reclamar` cada vez que el jugador escribe un número correcto.
//
// El anfitrión (quien creó el duelo) es el árbitro: genera el sudoku, lo
// manda y decide de quién es cada casilla. El invitado le pide las
// casillas y obedece lo que conteste.
//
// Un duelo puede tener varias rondas sobre la misma conexión: al terminar
// una con el tablero lleno, cualquiera pide la revancha y, cuando los dos
// la pidieron, el anfitrión manda otro sudoku de la misma dificultad.
//
// Mensajes (todos llevan `tipo`):
//   invitado -> anfitrión   hola      { version }              al conectarse
//   anfitrión -> invitado   empezar   { dificultad, puzzle, solucion }   cada ronda
//   invitado -> anfitrión   reclamo   { indice, valor }
//   anfitrión -> invitado   casilla   { indice, valor, dueno }  'anfitrion' | 'invitado'
//   anfitrión -> invitado   fin       { puntos: { anfitrion, invitado } }
//   cualquiera              revancha  {}                       quiere jugar otra ronda
//   cualquiera              adios     { motivo? }              se rindió, salió o no son compatibles
//
//   const sesion = crearSesionDuelo({
//     conexion,
//     rol: 'anfitrion' | 'invitado',
//     dificultad,                       solo cuenta la del anfitrión
//     alEmpezar: (partida) => ...,      empieza una ronda (ver partida-duelo.js)
//     alCambiar: () => ...,             el rival se anotó algo o se corrigió una casilla
//     alTerminar: ({ motivo, puntos }) => ...,   puntos: { yo, rival }
//     alRivalPideRevancha: () => ...,
//     alRivalSeFue: () => ...,          entre rondas: ya no habrá revancha
//   });
//   sesion.reclamar(indice, valor);    el jugador escribió un número correcto
//   sesion.pedirRevancha();
//   sesion.abandonar();                se va: avisa al rival y cierra
//
// `motivo` al terminar una ronda: 'completo' (tablero lleno; se puede pedir
// revancha), 'rendicion' (el rival se rindió o salió), 'desconexion' (se
// cortó la conexión) o 'version' (los dos teléfonos tienen versiones
// distintas del juego). Salvo 'completo', el duelo queda cerrado.

import { DIFICULTADES } from '../sudoku/dificultades.js';
import { generarPuzzle } from '../sudoku/generador.js';
import { tableroATexto, textoATablero } from '../sudoku/tablero.js';
import { Arbitro } from './arbitro.js';
import { PartidaDuelo } from './partida-duelo.js';
import { VERSION_PROTOCOLO } from './reglas.js';

const OTRO_ROL = { anfitrion: 'invitado', invitado: 'anfitrion' };

export function crearSesionDuelo({
  conexion,
  rol,
  dificultad = 'facil',
  generar = generarPuzzle, // las pruebas pueden pasar un sudoku fijo
  alEmpezar = () => {},
  alCambiar = () => {},
  alTerminar = () => {},
  alRivalPideRevancha = () => {},
  alRivalSeFue = () => {},
}) {
  let partida = null;
  let arbitro = null;
  // 'esperando' (todavía no hay sudoku), 'jugando', 'entre-rondas' o 'cerrada'.
  let estado = 'esperando';
  const revancha = { yo: false, rival: false };

  // Los puntos del árbitro vistos desde este teléfono.
  const puntosLocales = (puntos) => ({ yo: puntos[rol], rival: puntos[OTRO_ROL[rol]] });

  // Fin de la ronda. Con el tablero lleno el duelo sigue abierto para la
  // revancha; con cualquier otro motivo se cierra.
  function terminar(motivo, puntos = partida ? partida.puntos : { yo: 0, rival: 0 }) {
    if (estado !== 'jugando' && estado !== 'esperando') return;
    estado = motivo === 'completo' ? 'entre-rondas' : 'cerrada';
    alTerminar({ motivo, puntos });
  }

  // El rival se fue o se cortó la conexión.
  function perderRival(motivo) {
    if (estado === 'entre-rondas') {
      estado = 'cerrada';
      alRivalSeFue();
    } else {
      terminar(motivo);
    }
  }

  function empezar({ dificultad: elegida, puzzle, solucion }) {
    estado = 'jugando';
    revancha.yo = false;
    revancha.rival = false;
    partida = new PartidaDuelo({
      dificultad: elegida,
      tableroInicial: textoATablero(puzzle),
      solucion: textoATablero(solucion),
    });
    alEmpezar(partida);
  }

  /* ---------- Anfitrión: el árbitro ---------- */

  // Una ronda nueva: sudoku nuevo para los dos.
  function nuevaRonda() {
    const { puzzle, solucion } = generar(DIFICULTADES[dificultad].pistas);
    arbitro = new Arbitro({ tableroInicial: puzzle, solucion });
    const datos = { dificultad, puzzle: tableroATexto(puzzle), solucion: tableroATexto(solucion) };
    conexion.enviar({ tipo: 'empezar', ...datos });
    empezar(datos);
  }

  // Atiende un pedido (propio o del invitado) y le cuenta al invitado cómo
  // quedó la casilla, se la haya dado o no: así el invitado corrige lo que
  // había dado por suyo.
  function arbitrar(quien, indice, valor) {
    if (estado !== 'jugando') return;
    const acepto = arbitro.reclamar(quien, indice, valor);
    const dueno = arbitro.duenos[indice];
    if (dueno === null) return; // pedido inválido sobre una casilla libre

    conexion.enviar({ tipo: 'casilla', indice, valor: arbitro.solucion[indice], dueno });
    if (acepto && quien === 'invitado') {
      partida.anotarCasilla(indice, valor, 'rival');
      alCambiar();
    }
    if (arbitro.completo) {
      conexion.enviar({ tipo: 'fin', puntos: arbitro.puntos });
      terminar('completo', puntosLocales(arbitro.puntos));
    }
  }

  function alRecibirComoAnfitrion(mensaje) {
    if (mensaje.tipo === 'hola') {
      if (mensaje.version !== VERSION_PROTOCOLO) {
        conexion.enviar({ tipo: 'adios', motivo: 'version' });
        conexion.cerrar();
        terminar('version');
        return;
      }
      nuevaRonda();
    } else if (mensaje.tipo === 'reclamo') {
      arbitrar('invitado', mensaje.indice, mensaje.valor);
    }
  }

  /* ---------- Invitado: obedece al árbitro ---------- */

  function alRecibirComoInvitado(mensaje) {
    if (mensaje.tipo === 'empezar') {
      empezar(mensaje);
    } else if (mensaje.tipo === 'casilla' && estado === 'jugando') {
      partida.anotarCasilla(mensaje.indice, mensaje.valor, mensaje.dueno === rol ? 'yo' : 'rival');
      alCambiar();
    } else if (mensaje.tipo === 'fin') {
      terminar('completo', puntosLocales(mensaje.puntos));
    }
  }

  /* ---------- Revancha ---------- */

  // Cuando los dos la pidieron, el anfitrión arranca la ronda nueva.
  function revisarRevancha() {
    if (revancha.yo && revancha.rival && rol === 'anfitrion') nuevaRonda();
  }

  function alRecibirRevancha() {
    if (estado !== 'entre-rondas' || revancha.rival) return;
    revancha.rival = true;
    alRivalPideRevancha();
    revisarRevancha();
  }

  /* ---------- Arranque ---------- */

  conexion.alRecibir((mensaje) => {
    if (estado === 'cerrada') return;
    if (mensaje.tipo === 'adios') {
      perderRival(mensaje.motivo === 'version' ? 'version' : 'rendicion');
      conexion.cerrar();
    } else if (mensaje.tipo === 'revancha') {
      alRecibirRevancha();
    } else if (rol === 'anfitrion') {
      alRecibirComoAnfitrion(mensaje);
    } else {
      alRecibirComoInvitado(mensaje);
    }
  });
  conexion.alCerrarse(() => {
    if (estado !== 'cerrada') perderRival('desconexion');
  });

  if (rol === 'invitado') conexion.enviar({ tipo: 'hola', version: VERSION_PROTOCOLO });

  return {
    get partida() {
      return partida;
    },
    reclamar(indice, valor) {
      if (estado !== 'jugando') return;
      if (rol === 'anfitrion') arbitrar('anfitrion', indice, valor);
      else conexion.enviar({ tipo: 'reclamo', indice, valor });
    },
    pedirRevancha() {
      if (estado !== 'entre-rondas' || revancha.yo) return;
      revancha.yo = true;
      conexion.enviar({ tipo: 'revancha' });
      revisarRevancha();
    },
    abandonar() {
      if (estado === 'cerrada') return;
      estado = 'cerrada';
      conexion.enviar({ tipo: 'adios' });
      conexion.cerrar();
    },
  };
}
