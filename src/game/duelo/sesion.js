// Un duelo en curso entre dos teléfonos, sobre una conexión cualquiera
// (ver transportes/memoria.js para lo que es una conexión). Aquí no hay
// pantalla: la pantalla (screens/duelo.js) escucha los eventos y llama a
// `reclamar` cada vez que el jugador escribe un número correcto.
//
// El anfitrión (quien creó el duelo) es el árbitro: genera el sudoku, lo
// manda y decide de quién es cada casilla. El invitado le pide las
// casillas y obedece lo que conteste.
//
// Mensajes (todos llevan `tipo`):
//   invitado -> anfitrión   hola      { version }              al conectarse
//   anfitrión -> invitado   empezar   { dificultad, puzzle, solucion }
//   invitado -> anfitrión   reclamo   { indice, valor }
//   anfitrión -> invitado   casilla   { indice, valor, dueno }  'anfitrion' | 'invitado'
//   anfitrión -> invitado   fin       { puntos: { anfitrion, invitado } }
//   cualquiera              adios     { motivo? }              se rindió, salió o no son compatibles
//
//   const sesion = crearSesionDuelo({
//     conexion,
//     rol: 'anfitrion' | 'invitado',
//     dificultad,                       solo cuenta la del anfitrión
//     alEmpezar: (partida) => ...,      llegó el sudoku (ver partida-duelo.js)
//     alCambiar: () => ...,             el rival se anotó algo o se corrigió una casilla
//     alTerminar: ({ motivo, puntos }) => ...,   puntos: { yo, rival }
//   });
//   sesion.reclamar(indice, valor);    el jugador escribió un número correcto
//   sesion.abandonar();                se rinde: avisa al rival y cierra
//
// `motivo` al terminar: 'completo' (tablero lleno), 'rendicion' (el rival
// se rindió o salió), 'desconexion' (se cortó la conexión) o 'version'
// (los dos teléfonos tienen versiones distintas del juego).

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
}) {
  let partida = null;
  let arbitro = null;
  let terminada = false;

  // Los puntos del árbitro vistos desde este teléfono.
  const puntosLocales = (puntos) => ({ yo: puntos[rol], rival: puntos[OTRO_ROL[rol]] });

  function terminar(motivo, puntos = partida ? partida.puntos : { yo: 0, rival: 0 }) {
    if (terminada) return;
    terminada = true;
    alTerminar({ motivo, puntos });
  }

  function empezar({ dificultad: elegida, puzzle, solucion }) {
    partida = new PartidaDuelo({
      dificultad: elegida,
      tableroInicial: textoATablero(puzzle),
      solucion: textoATablero(solucion),
    });
    alEmpezar(partida);
  }

  /* ---------- Anfitrión: el árbitro ---------- */

  // Atiende un pedido (propio o del invitado) y le cuenta al invitado cómo
  // quedó la casilla, se la haya dado o no: así el invitado corrige lo que
  // había dado por suyo.
  function arbitrar(quien, indice, valor) {
    if (terminada || !arbitro) return;
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
      const { puzzle, solucion } = generar(DIFICULTADES[dificultad].pistas);
      arbitro = new Arbitro({ tableroInicial: puzzle, solucion });
      const datos = { dificultad, puzzle: tableroATexto(puzzle), solucion: tableroATexto(solucion) };
      conexion.enviar({ tipo: 'empezar', ...datos });
      empezar(datos);
    } else if (mensaje.tipo === 'reclamo') {
      arbitrar('invitado', mensaje.indice, mensaje.valor);
    }
  }

  /* ---------- Invitado: obedece al árbitro ---------- */

  function alRecibirComoInvitado(mensaje) {
    if (mensaje.tipo === 'empezar') {
      empezar(mensaje);
    } else if (mensaje.tipo === 'casilla' && partida) {
      partida.anotarCasilla(mensaje.indice, mensaje.valor, mensaje.dueno === rol ? 'yo' : 'rival');
      alCambiar();
    } else if (mensaje.tipo === 'fin') {
      terminar('completo', puntosLocales(mensaje.puntos));
    }
  }

  /* ---------- Arranque ---------- */

  conexion.alRecibir((mensaje) => {
    if (terminada) return;
    if (mensaje.tipo === 'adios') {
      terminar(mensaje.motivo === 'version' ? 'version' : 'rendicion');
      conexion.cerrar();
    } else if (rol === 'anfitrion') {
      alRecibirComoAnfitrion(mensaje);
    } else {
      alRecibirComoInvitado(mensaje);
    }
  });
  conexion.alCerrarse(() => terminar('desconexion'));

  if (rol === 'invitado') conexion.enviar({ tipo: 'hola', version: VERSION_PROTOCOLO });

  return {
    get partida() {
      return partida;
    },
    reclamar(indice, valor) {
      if (terminada) return;
      if (rol === 'anfitrion') arbitrar('anfitrion', indice, valor);
      else conexion.enviar({ tipo: 'reclamo', indice, valor });
    },
    abandonar() {
      if (terminada) return;
      terminada = true;
      conexion.enviar({ tipo: 'adios' });
      conexion.cerrar();
    },
  };
}
