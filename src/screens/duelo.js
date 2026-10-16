// Página del modo Duelo: #/duelo
//
// Dos jugadores, cada uno en su teléfono, llenan el mismo sudoku: cada
// casilla es de quien ponga primero el número correcto (las reglas de
// Uriel, pero contra una persona). Primero la sala (ui/sala-duelo.js),
// donde uno crea el duelo y el otro se une; al conectarse, la pelea, en
// esta misma pantalla.
//
// Al terminar una ronda con el tablero lleno, cualquiera puede pedir la
// revancha: cuando los dos la piden empieza otra, sin volver a conectarse.
//
// Las reglas y los mensajes entre los dos teléfonos están en
// game/duelo/; aquí solo se dibuja. Sin un transporte disponible (ver
// game/duelo/transporte.js) el modo no existe y se vuelve al inicio.

import { RUTA_INICIO, navegar } from '../router.js';
import { DIFICULTADES } from '../game/sudoku/dificultades.js';
import { crearSesionDuelo } from '../game/duelo/sesion.js';
import { NOMBRE_DUELO } from '../game/duelo/reglas.js';
import { transporteDisponible } from '../game/duelo/transporte.js';
import { leerPreferencias } from '../preferencias.js';
import { crearJuegoSudoku } from '../ui/juego-sudoku.js';
import { crearSalaDuelo } from '../ui/sala-duelo.js';
import { mostrarResultadoPelea } from '../ui/resultado-pelea.js';
import { confirmarRendicion, empezarPelea } from '../ui/pelea-en-curso.js';
import { tituloDeModo } from '../ui/modos.js';

const VOLVER_A_LA_SALA = { texto: 'Volver al duelo', ruta: 'duelo' };

// Lo que dice la ventana del final según cómo terminó (ver sesion.js).
function resultado({ motivo, puntos: { yo, rival } }) {
  const marcador = `Tú: ${yo} casillas · Rival: ${rival} casillas`;
  if (motivo === 'rendicion') {
    return { gano: true, titulo: '¡Ganaste el duelo!', detalle: `Tu rival se rindió. ${marcador}` };
  }
  if (motivo === 'desconexion') {
    return { gano: false, icono: '📡', titulo: 'Se perdió la conexión', detalle: `El duelo quedó así. ${marcador}` };
  }
  if (motivo === 'version') {
    return {
      gano: false,
      icono: '⚠️',
      titulo: 'No se pudo jugar',
      detalle: 'Los dos teléfonos necesitan la misma versión de SudoCam.',
    };
  }
  if (yo === rival) return { gano: false, icono: '🤝', titulo: 'Empate', detalle: marcador };
  return yo > rival
    ? { gano: true, titulo: '¡Ganaste el duelo!', detalle: marcador }
    : { gano: false, titulo: 'Tu rival ganó el duelo', detalle: marcador };
}

// Marcador de arriba: tira y afloja entre los dos, como el de Uriel.
function crearMarcador(contenedor, { dificultad }) {
  const tarjeta = document.createElement('section');
  tarjeta.className = 'card cabecera-duelo';
  tarjeta.innerHTML = `
    <div class="cabecera-duelo-info">
      <span class="badge acento">${DIFICULTADES[dificultad].nombre}</span>
      <span data-id="tiempo"></span>
      <span class="campo-ayuda" data-id="quedan"></span>
    </div>
    <div class="marcador">
      <span class="marcador-lado jugador"><small>Tú</small><strong data-id="yo">0</strong></span>
      <span class="marcador-barra">
        <span class="marcador-relleno jugador" data-id="barra-yo"></span>
        <span class="marcador-relleno jefe" data-id="barra-rival"></span>
      </span>
      <span class="marcador-lado jefe"><small>Rival</small><strong data-id="rival">0</strong></span>
    </div>
  `;
  contenedor.appendChild(tarjeta);
  const parte = (id) => tarjeta.querySelector(`[data-id="${id}"]`);

  return {
    lugarDelTiempo: parte('tiempo'),
    mostrar({ yo, rival }, total) {
      parte('yo').textContent = String(yo);
      parte('rival').textContent = String(rival);
      parte('barra-yo').style.width = `${(yo / total) * 100}%`;
      parte('barra-rival').style.width = `${(rival / total) * 100}%`;
      parte('quedan').textContent = `Quedan ${total - yo - rival} casillas`;
    },
  };
}

let limpiar = () => {};

export const pantallaDuelo = {
  titulo: NOMBRE_DUELO,
  subtitulo: 'Teléfono contra teléfono',
  antesDeSalir: confirmarRendicion,

  render(contenedor) {
    const transporte = transporteDisponible();
    if (!transporte) {
      navegar(RUTA_INICIO);
      return;
    }

    let sesion = null;
    let juego = null;
    let redibujar = () => {}; // tablero y marcador, una vez empezada la pelea
    let ventanaResultado = null; // abierta entre rondas, hasta que el jugador elige
    let esperaRevancha = null; // tarjeta "esperando a tu rival" tras pedir la revancha

    contenedor.innerHTML = `<section class="menu-seccion">${tituloDeModo('duelo')}</section>`;
    const sala = crearSalaDuelo(contenedor, { transporte, alConectarse: empezarDuelo });

    /* ---------- La pelea ---------- */

    function empezarDuelo({ conexion, rol, dificultad }) {
      sala.destruir();
      contenedor.innerHTML = '<p class="empty-state">Preparando el duelo…</p>';

      sesion = crearSesionDuelo({
        conexion,
        rol,
        dificultad,
        alEmpezar: dibujarPelea,
        alCambiar: () => redibujar(),
        alTerminar: terminar,
        alRivalPideRevancha: () => ventanaResultado?.avisar('Tu rival quiere la revancha.'),
        alRivalSeFue: rivalSeFue,
      });
    }

    function dibujarPelea(partida) {
      empezarPelea(); // desde aquí, salir pide confirmar la rendición
      juego?.destruir(); // la ronda anterior, si hubo revancha
      ventanaResultado = null;
      esperaRevancha = null;
      contenedor.innerHTML = '';
      const marcador = crearMarcador(contenedor, { dificultad: partida.dificultad });
      const actualizarMarcador = () => marcador.mostrar(partida.puntos, partida.casillasALlenar);

      juego = crearJuegoSudoku(contenedor, {
        partida,
        preferencias: leerPreferencias(),
        lugarDelCronometro: marcador.lugarDelTiempo,
        mostrarErrores: false,
        marcas: () => ({ jugador: partida.celdasDe('yo'), rival: partida.celdasDe('rival') }),
        alJugar: ({ indice, valor, correcto }) => {
          if (correcto) sesion.reclamar(indice, valor);
          actualizarMarcador();
        },
        // El final lo decide el árbitro (alTerminar), no el tablero lleno.
        alGanar: () => {},
      });

      // Para las jugadas del rival y las correcciones del árbitro.
      redibujar = () => {
        juego.dibujar();
        actualizarMarcador();
      };
      actualizarMarcador();
    }

    function terminar(fin) {
      juego?.detenerCronometro();
      redibujar();
      // Solo tras un tablero lleno sigue habiendo alguien con quien jugar.
      const hayRevancha = fin.motivo === 'completo';
      ventanaResultado = mostrarResultadoPelea({
        ...resultado(fin),
        alRevancha: hayRevancha ? pedirRevancha : null,
        volver: VOLVER_A_LA_SALA,
      });
    }

    /* ---------- Revancha ---------- */

    // La ventana del resultado ya se cerró: mientras el rival no acepte,
    // una tarjeta arriba del tablero lo dice.
    function pedirRevancha() {
      ventanaResultado = null;
      esperaRevancha = document.createElement('section');
      esperaRevancha.className = 'card espera-revancha';
      esperaRevancha.innerHTML = `
        <p data-id="texto">Pediste la revancha. Esperando a tu rival…</p>
        <button type="button" class="btn btn-secondary btn-sm">Salir del duelo</button>
      `;
      esperaRevancha.querySelector('button').addEventListener('click', () => navegar('duelo'));
      contenedor.prepend(esperaRevancha);
      sesion.pedirRevancha();
    }

    function rivalSeFue() {
      ventanaResultado?.quitarRevancha();
      ventanaResultado?.avisar('Tu rival salió del duelo.');
      if (esperaRevancha) {
        esperaRevancha.querySelector('[data-id="texto"]').textContent = 'Tu rival salió del duelo.';
        esperaRevancha.querySelector('button').textContent = 'Volver al duelo';
      }
    }

    limpiar = () => {
      sala.destruir();
      sesion?.abandonar(); // salir a mitad de duelo es rendirse
      juego?.destruir();
    };
  },

  destruir() {
    limpiar();
    limpiar = () => {};
  },
};
