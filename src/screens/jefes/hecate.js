// Pantalla de la pelea contra Hecate (y Uber Hecate con ?uber=1).
//
// Las reglas viven en game/jefes/hecate.js. Esta pantalla arma la
// cabecera con el reloj grande, mueve el reloj cada segundo, anuncia lo
// que hace Hecate y le pasa al tablero y al teclado sus engaños.

import { RUTA_INICIO, navegar } from '../../router.js';
import { DIFICULTADES } from '../../game/sudoku/dificultades.js';
import { generarPuzzle } from '../../game/sudoku/generador.js';
import { PeleaHecate, SEGUNDOS_PENALIZACION, SEGUNDOS_TOTALES } from '../../game/jefes/hecate.js';
import { JEFES } from '../../game/jefes/catalogo.js';
import { jefeDesbloqueado, registrarVictoriaDeJefe } from '../../game/jefes/registro.js';
import { leerPreferencias } from '../../preferencias.js';
import { crearJuegoSudoku } from '../../ui/juego-sudoku.js';
import { crearCabeceraJefe, habilidadDeSeccion } from '../../ui/cabecera-jefe.js';
import { crearRegistroEventos } from '../../ui/registro-eventos.js';
import { mostrarResultadoPelea } from '../../ui/resultado-pelea.js';
import { mostrarLogrosNuevos } from '../../ui/aviso-logro.js';
import { formatearSegundos } from '../../ui/cronometro.js';

const DESCRIPCION_FASE = {
  1: `Resuelve el tablero antes de que se acabe el reloj. Cada error te cuesta ${SEGUNDOS_PENALIZACION / 60} minuto.`,
  2: 'Fase 2: además de sus ilusiones y su aullido, Hecate disfraza tus propios números.',
};
const SEGUNDOS_RELOJ_CRITICO = 60;

// Nombres, iconos y cartas de las habilidades: los de su página de
// información (game/jefes/catalogo.js).
const { ataque1: VISION, ataque2: MALDICION, pasiva: AULLIDO, secreto: PESAR } = JEFES.hecate;

let limpiar = () => {};

export const pantallaHecate = {
  titulo: 'Pelea de jefe',
  // Contra quién es la pelea (para usar su tema; ver tema.js).
  jefe: (params) => (params.get('uber') === '1' ? 'hecate_uber' : 'hecate'),
  subtitulo: 'Resuelve el tablero antes de que acabe el reloj',

  render(contenedor, params) {
    const uber = params.get('uber') === '1';
    const idJefe = uber ? 'hecate_uber' : 'hecate';
    if (!jefeDesbloqueado(idJefe)) {
      navegar(RUTA_INICIO);
      return;
    }

    const { puzzle, solucion } = generarPuzzle(DIFICULTADES.medio.pistas);
    const pelea = new PeleaHecate({ tableroInicial: puzzle, solucion, uber });

    const cabecera = crearCabeceraJefe(contenedor, {
      id: idJefe,
      uber,
      reloj: true,
      habilidades: [
        habilidadDeSeccion('vision', VISION),
        habilidadDeSeccion('maldicion', MALDICION, { oculta: true }),
        habilidadDeSeccion('aullido', AULLIDO),
        habilidadDeSeccion('pesar', PESAR),
      ],
    });
    const { habilidades } = cabecera;

    const cuerpo = document.createElement('div');
    cuerpo.className = 'pelea-cuerpo';
    contenedor.appendChild(cuerpo);
    let terminada = false;

    const juego = crearJuegoSudoku(cuerpo, {
      partida: pelea,
      preferencias: leerPreferencias(),
      mostrarErrores: false,
      mostrarCronometro: false,
      accionesExtra: [{ texto: 'Rendirse', alTocar: () => navegar(RUTA_INICIO) }],
      disfraz: () => pelea.disfraz(),
      // La ilusión de la Hecate normal parpadea lento; la uber no se distingue.
      marcas: () => {
        const { valores } = pelea.disfraz();
        const ilusion = pelea.ilusion && valores.has(pelea.ilusion.indice) ? [pelea.ilusion.indice] : [];
        const maldicion = pelea.maldicion ? [pelea.maldicion.indice] : [];
        return {
          ilusion: new Set(ilusion),
          'ilusion-parpadeante': new Set(uber ? [] : ilusion),
          maldicion: new Set(maldicion),
        };
      },
      estadoTeclado: () => ({
        bloqueados: new Set(pelea.petrificado ? [pelea.petrificado.digito] : []),
        cargando: new Map(pelea.aullido ? [[pelea.aullido.digito, pelea.carga.aullido]] : []),
      }),
      alJugar: ({ correcto }) => {
        if (!correcto) {
          registro.anotar('Pesar Castigador: Hecate te quitó 1 minuto por ese error.', 'jefe');
          habilidades.pesar.destello();
        }
        actualizarCabecera();
        if (pelea.derrotada) perder('Pesar Castigador te dejó sin tiempo: demasiados errores.');
      },
      alGanar: ganar,
    });

    const registro = uber ? { anotar: () => {} } : crearRegistroEventos(cuerpo);

    /* ---------- Cabecera ---------- */

    let faseMostrada = 1;

    function actualizarCabecera() {
      cabecera.mostrarReloj(pelea.restantes, pelea.restantes <= SEGUNDOS_RELOJ_CRITICO);
      const fase = pelea.fase;
      cabecera.mostrarFase(fase, DESCRIPCION_FASE[fase]
        + (uber ? ' Ilusiones perfectas: sus visiones ya no se distinguen de los números reales.' : ''));
      if (fase === 2 && faseMostrada === 1) {
        faseMostrada = 2;
        habilidades.maldicion.elemento.classList.remove('hidden');
        registro.anotar('¡Hecate despertó su maldición de pesadilla!', 'jefe');
      }
      habilidades.vision.cargar(pelea.carga.vision);
      habilidades.aullido.cargar(pelea.carga.aullido);
      if (fase === 2) habilidades.maldicion.cargar(pelea.carga.maldicion);
    }

    /* ---------- El reloj ---------- */

    const ANUNCIOS = {
      vision: (e) => `Visiones ilusorias: Hecate encantó una celda vacía con un ${e.valor} falso.`,
      maldicion: (e) => `Maldición de pesadilla: disfrazó ${e.sobre === 'nota' ? 'una nota' : 'uno de tus números'} con un ${e.falso}.`,
      petrifica: (e) => `Aullido paralizante: petrificó el ${e.digito}.`,
      libera: (e) => `El ${e.digito} se liberó de la piedra.`,
    };
    const ICONO_DE_EVENTO = { vision: 'vision', maldicion: 'maldicion', petrifica: 'aullido' };

    const reloj = setInterval(() => {
      if (terminada) return;
      for (const evento of pelea.avanzarUnSegundo()) {
        if (evento.tipo === 'derrota') {
          perder('El tiempo se acabó antes de que terminaras el tablero.');
          return;
        }
        registro.anotar(ANUNCIOS[evento.tipo](evento), evento.tipo === 'libera' ? 'jugador' : 'jefe');
        const icono = habilidades[ICONO_DE_EVENTO[evento.tipo]];
        if (icono) {
          icono.reiniciar();
          icono.destello();
        }
      }
      actualizarCabecera();
      juego.dibujar();
    }, 1000);

    /* ---------- Fin ---------- */

    function terminar() {
      terminada = true;
      clearInterval(reloj);
      juego.destruir();
    }

    async function ganar() {
      terminar();
      const segundos = SEGUNDOS_TOTALES - pelea.restantes;
      mostrarResultadoPelea({
        gano: true,
        titulo: '¡Resististe la locura de Hecate!',
        detalle: `Lo resolviste con ${formatearSegundos(pelea.restantes)} de sobra.`,
        alRevancha: () => navegar('jefe-hecate', uber ? { uber: 1 } : {}),
      });
      mostrarLogrosNuevos(await registrarVictoriaDeJefe(idJefe, { segundos, errores: pelea.errores, usoNotas: pelea.usoNotas }));
    }

    function perder(detalle) {
      if (terminada) return;
      terminar();
      mostrarResultadoPelea({
        gano: false,
        titulo: 'Hecate se llevó tu cordura',
        detalle,
        alRevancha: () => navegar('jefe-hecate', uber ? { uber: 1 } : {}),
      });
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
