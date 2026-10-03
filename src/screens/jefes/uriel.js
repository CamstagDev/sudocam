// Pantalla de la pelea contra Uriel (y Uber Uriel con ?uber=1).
//
// Las reglas viven en game/jefes/uriel.js; el tablero, el teclado y las
// notas son el mismo ui/juego-sudoku.js de siempre. Aquí se arma la
// cabecera del jefe (retrato, fase, habilidades, marcador), se lleva el
// reloj de las búsquedas de Uriel y se animan.

import { RUTA_INICIO, navegar } from '../../router.js';
import { DIFICULTADES } from '../../game/sudoku/dificultades.js';
import { generarPuzzle } from '../../game/sudoku/generador.js';
import { LIENZO_9X9 } from '../../game/sudoku/lienzo.js';
import { PeleaUriel, cajaDe, celdasARevisar, elegirCajaAlAzar } from '../../game/jefes/uriel.js';
import { JEFES } from '../../game/jefes/catalogo.js';
import { jefeDesbloqueado, registrarVictoriaDeJefe } from '../../game/jefes/registro.js';
import { leerPreferencias } from '../../preferencias.js';
import { crearJuegoSudoku } from '../../ui/juego-sudoku.js';
import { crearRetratoJefe } from '../../ui/retrato-jefe.js';
import { crearIconoHabilidad } from '../../ui/icono-habilidad.js';
import { crearRegistroEventos } from '../../ui/registro-eventos.js';
import { mostrarResultadoPelea } from '../../ui/resultado-pelea.js';
import { mostrarLogrosNuevos } from '../../ui/aviso-logro.js';

const MS_POR_CELDA_REVISADA = 160; // velocidad de la animación de búsqueda
const TOQUES_SECRETO = 3; // toques al retrato para forzar la fase 2

const DESCRIPCION_FASE = {
  1: JEFES.uriel.descripcion,
  2: 'Fase 2: cada 30 s Uriel también busca por descarte, además de su búsqueda fácil de cada 15 s.',
};

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

let limpiar = () => {};

export const pantallaUriel = {
  titulo: 'Pelea de jefe',
  subtitulo: 'Llena más casillas que Uriel',

  render(contenedor, params) {
    const uber = params.get('uber') === '1';
    const idJefe = uber ? 'uriel_uber' : 'uriel';
    if (!jefeDesbloqueado(idJefe)) {
      navegar(RUTA_INICIO);
      return;
    }

    const { puzzle, solucion } = generarPuzzle(DIFICULTADES.facil.pistas);
    const pelea = new PeleaUriel({ tableroInicial: puzzle, solucion, uber });

    /* ---------- Cabecera del jefe ---------- */

    const cabecera = document.createElement('section');
    cabecera.className = 'card cabecera-jefe';
    cabecera.innerHTML = `
      <div class="cabecera-jefe-fila">
        <div data-id="retrato"></div>
        <div class="cabecera-jefe-texto">
          <p class="cabecera-jefe-nombre">
            Uriel
            ${uber ? '<span class="badge negativo">UBER</span>' : ''}
            <span class="badge" data-id="fase">Fase 1</span>
          </p>
          <p class="campo-ayuda" data-id="descripcion"></p>
        </div>
      </div>
      <div class="habilidades" data-id="habilidades"></div>
      <div class="marcador">
        <span class="marcador-lado jugador"><small>Tú</small><strong data-id="puntos-jugador">0</strong></span>
        <span class="marcador-barra">
          <span class="marcador-relleno jugador" data-id="barra-jugador"></span>
          <span class="marcador-relleno jefe" data-id="barra-jefe"></span>
        </span>
        <span class="marcador-lado jefe"><small>Uriel</small><strong data-id="puntos-jefe">0</strong></span>
      </div>
    `;
    contenedor.appendChild(cabecera);
    const parte = (id) => cabecera.querySelector(`[data-id="${id}"]`);

    const retrato = crearRetratoJefe(idJefe);
    parte('retrato').replaceWith(retrato);

    const habilidades = {
      facil: crearIconoHabilidad({ emoji: '🔍', nombre: 'Búsqueda fácil' }),
      descarte: crearIconoHabilidad({ emoji: '🧮', nombre: 'Búsqueda por descarte' }),
      purga: crearIconoHabilidad({ emoji: '⚖️', nombre: 'Purga del Débil' }),
    };
    Object.values(habilidades).forEach((icono) => parte('habilidades').appendChild(icono.elemento));
    habilidades.descarte.elemento.classList.add('hidden');

    /* ---------- Cuerpo: tablero y registro ---------- */

    const cuerpo = document.createElement('div');
    cuerpo.className = 'pelea-cuerpo';
    contenedor.appendChild(cuerpo);

    // Lo que la animación de búsqueda está marcando ahora mismo.
    const busqueda = { caja: new Set(), celda: new Set(), relacionadas: new Set() };
    let terminada = false;

    const juego = crearJuegoSudoku(cuerpo, {
      partida: pelea,
      preferencias: leerPreferencias(),
      mostrarErrores: false,
      accionesExtra: [{ texto: 'Rendirse', alTocar: () => navegar(RUTA_INICIO) }],
      marcas: () => ({
        jugador: new Set(pelea.duenos.flatMap((dueno, i) => (dueno === 'jugador' ? [i] : []))),
        jefe: new Set(pelea.duenos.flatMap((dueno, i) => (dueno === 'jefe' ? [i] : []))),
        'jefe-mirando': busqueda.caja,
        'jefe-buscando': busqueda.celda,
        'jefe-relacionada': busqueda.relacionadas,
      }),
      // Pasiva "Purga del Débil": cada error hace que Uriel revise esa caja.
      alJugar: ({ indice, correcto }) => {
        actualizarCabecera();
        if (!correcto) encolarBusqueda('pasiva', [cajaDe(indice)]);
      },
      alGanar: terminar,
    });

    // El registro va al lado del tablero (debajo en el teléfono). Uber no
    // telegrafía nada: sin registro ni iconos de habilidades.
    const registro = uber ? { anotar: () => {} } : crearRegistroEventos(cuerpo);
    if (uber) parte('habilidades').classList.add('hidden');

    /* ---------- Cabecera: fase y marcador ---------- */

    let faseMostrada = 1;

    function actualizarCabecera() {
      const { jugador, jefe } = pelea.puntos;
      parte('puntos-jugador').textContent = String(jugador);
      parte('puntos-jefe').textContent = String(jefe);
      parte('barra-jugador').style.width = `${(jugador / pelea.casillasALlenar) * 100}%`;
      parte('barra-jefe').style.width = `${(jefe / pelea.casillasALlenar) * 100}%`;

      const fase = pelea.fase;
      parte('fase').textContent = `Fase ${fase}`;
      parte('fase').classList.toggle('negativo', fase === 2);
      parte('descripcion').textContent = DESCRIPCION_FASE[fase]
        + (uber ? ' Uber Uriel lanza cada búsqueda sobre 2 cajas distintas.' : '');

      if (fase === 2 && faseMostrada === 1) {
        faseMostrada = 2;
        habilidades.descarte.elemento.classList.remove('hidden');
        registro.anotar('¡Uriel subió a fase 2! Ahora también busca por descarte.', 'jefe');
      }
    }

    // Truco secreto: 3 toques al retrato fuerzan la fase 2.
    let toques = 0;
    retrato.addEventListener('click', () => {
      if (terminada || pelea.fase === 2 || ++toques < TOQUES_SECRETO) return;
      pelea.faseForzada = true;
      registro.anotar('🤫 Truco secreto: forzaste la fase 2 de Uriel antes de tiempo.', 'neutro');
      actualizarCabecera();
    });

    /* ---------- Búsquedas de Uriel ---------- */

    // Las búsquedas van en fila: si llega una mientras otra se anima,
    // espera su turno en vez de encimarse.
    let cola = Promise.resolve();

    // `cajas`: las de la pasiva (fija la del error); si no viene, se eligen
    // al azar tantas como `cajasPorBusqueda` (2 en uber).
    function encolarBusqueda(tipo, cajas = null) {
      cola = cola.then(async () => {
        const elegidas = [];
        const cantidad = cajas ? cajas.length : pelea.cajasPorBusqueda;
        for (let i = 0; i < cantidad && !terminada; i++) {
          const caja = cajas ? cajas[i] : elegirCajaAlAzar(pelea.tablero, pelea.solucion, elegidas);
          if (!caja) return;
          elegidas.push(caja);
          await buscarEnCaja(tipo, caja);
        }
      });
    }

    async function buscarEnCaja(tipoPedido, caja) {
      // La pasiva usa la técnica de la fase en la que está Uriel ahora.
      const tecnica = tipoPedido === 'pasiva' ? (pelea.fase === 2 ? 'descarte' : 'facil') : tipoPedido;
      const jugada = pelea.buscarJugada(tecnica, caja);

      busqueda.caja = new Set(caja);
      for (const indice of celdasARevisar(pelea.tablero, pelea.solucion, caja)) {
        if (terminada) return;
        busqueda.celda = new Set([indice]);
        busqueda.relacionadas = new Set(LIENZO_9X9.vecinos[indice]);
        juego.dibujar();
        await esperar(MS_POR_CELDA_REVISADA);
        if (indice === jugada?.indice) break;
      }
      busqueda.caja = new Set();
      busqueda.celda = new Set();
      busqueda.relacionadas = new Set();
      if (terminada) return;

      const prefijo = tipoPedido === 'pasiva' ? 'Purga del Débil: ' : '';
      // Mientras se animaba, el jugador pudo haber puesto ese mismo número.
      if (jugada && pelea.tablero[jugada.indice] !== jugada.valor) {
        pelea.jugadaDelJefe(jugada);
        registro.anotar(`${prefijo}Uriel completó un ${jugada.valor}.`, 'jefe');
      } else {
        registro.anotar(`${prefijo}Uriel no encontró nada esta vez.`, 'jugador');
      }

      habilidades[tipoPedido === 'pasiva' ? 'purga' : tecnica].destello();
      actualizarCabecera();
      juego.dibujar();
    }

    /* ---------- Reloj de las habilidades ---------- */

    const reloj = setInterval(() => {
      if (terminada) return;
      for (const tipo of pelea.avanzarUnSegundo()) {
        encolarBusqueda(tipo);
        habilidades[tipo].reiniciar();
      }
      habilidades.facil.cargar(pelea.carga.facil);
      if (pelea.fase === 2) habilidades.descarte.cargar(pelea.carga.descarte);
    }, 1000);

    /* ---------- Fin ---------- */

    async function terminar(segundos) {
      terminada = true;
      clearInterval(reloj);
      const { jugador, jefe } = pelea.puntos;
      const gano = jugador > jefe;

      mostrarResultadoPelea({
        gano,
        titulo: gano ? '¡Le ganaste a Uriel!' : 'Uriel ganó esta vez',
        detalle: jugador === jefe
          ? `Empate (${jugador} a ${jefe}): para vencer a un jefe hay que superarlo, no empatarlo.`
          : `Tú: ${jugador} casillas · Uriel: ${jefe} casillas`,
        alRevancha: () => navegar('jefe-uriel', uber ? { uber: 1 } : {}),
      });

      if (gano) {
        mostrarLogrosNuevos(await registrarVictoriaDeJefe(idJefe, {
          segundos,
          errores: pelea.errores,
          usoNotas: pelea.usoNotas,
          puntosJefe: jefe,
        }));
      }
    }

    limpiar = () => {
      terminada = true;
      clearInterval(reloj);
      juego.destruir();
    };

    actualizarCabecera();
  },

  destruir() {
    limpiar();
    limpiar = () => {};
  },
};
