// Pantalla de la pelea contra Jörmungandr (y la uber con ?uber=1).
//
// Las reglas viven en game/jefes/jormungandr.js. Aquí: la cabecera con
// Hambre o Glotonería (un icono por fase, comparten el mismo reloj) y
// Ouroboros (con el vientre como numerito), el reloj de los bocados, el
// registro y el secreto de darle de comer.

import { RUTA_INICIO, navegar } from '../../router.js';
import { DIFICULTADES } from '../../game/sudoku/dificultades.js';
import { generarPuzzle } from '../../game/sudoku/generador.js';
import { PeleaJormungandr, SEGUNDOS_HAMBRE } from '../../game/jefes/jormungandr.js';
import { JEFES } from '../../game/jefes/catalogo.js';
import { jefeDesbloqueado, registrarVictoriaDeJefe } from '../../game/jefes/registro.js';
import { leerPreferencias } from '../../preferencias.js';
import { crearJuegoSudoku } from '../../ui/juego-sudoku.js';
import { crearCabeceraJefe, habilidadDeSeccion } from '../../ui/cabecera-jefe.js';
import { crearRegistroEventos } from '../../ui/registro-eventos.js';
import { mostrarResultadoPelea } from '../../ui/resultado-pelea.js';
import { mostrarLogrosNuevos } from '../../ui/aviso-logro.js';
import { formatearSegundos } from '../../ui/cronometro.js';

// Nombres, iconos y cartas de las habilidades: los de su página de
// información (game/jefes/catalogo.js).
const { ataque1: HAMBRE, ataque2: GLOTONERIA, pasiva: OUROBOROS } = JEFES.jormungandr;

// Qué icono come en cada fase, y la frase de arriba.
const POR_FASE = {
  1: {
    icono: 'hambre',
    descripcion: `${HAMBRE.titulo}: cada ${SEGUNDOS_HAMBRE} segundos devora un número que hayas puesto, como si nunca lo hubieras escrito.`,
  },
  2: {
    icono: 'glotoneria',
    descripcion: `Fase 2, ${GLOTONERIA.titulo}: cada ${SEGUNDOS_HAMBRE} segundos devora pistas originales del tablero (o números tuyos si ya no quedan).`,
  },
};

function describirBocados({ tecnica, bocados }) {
  const valores = bocados.map((bocado) => bocado.valor).join(', ');
  if (bocados.length === 0) return 'Jörmungandr no encontró nada que comer.';
  if (tecnica === 'hambre') return `Hambre: Jörmungandr devoró ${bocados.length > 1 ? 'tus números' : 'tu'} ${valores}.`;
  if (bocados[0].pista) return `Glotonería: devoró la pista original ${valores}; ya no está fija, tendrás que recordarla.`;
  return `Glotonería: sin pistas que devorar, se comió tus números ${valores}.`;
}

let limpiar = () => {};

export const pantallaJormungandr = {
  titulo: 'Pelea de jefe',
  subtitulo: 'Resuelve antes de que se lo coma todo',

  render(contenedor, params) {
    const uber = params.get('uber') === '1';
    const idJefe = uber ? 'jormungandr_uber' : 'jormungandr';
    if (!jefeDesbloqueado(idJefe)) {
      navegar(RUTA_INICIO);
      return;
    }

    const { puzzle, solucion } = generarPuzzle(DIFICULTADES.dificil.pistas);
    const pelea = new PeleaJormungandr({ tableroInicial: puzzle, solucion, uber });

    const cabecera = crearCabeceraJefe(contenedor, {
      id: idJefe,
      uber,
      habilidades: [
        habilidadDeSeccion('hambre', HAMBRE),
        habilidadDeSeccion('glotoneria', GLOTONERIA, { oculta: true }),
        habilidadDeSeccion('ouroboros', OUROBOROS),
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
      accionesExtra: [{ texto: 'Rendirse', alTocar: () => navegar(RUTA_INICIO) }],
      alJugar: actualizarCabecera,
      alGanar: ganar,
    });

    // La uber no telegrafía nada (como las de Uriel y Hecate): sin registro y
    // con los iconos silenciosos, todos a la vista desde el principio.
    const registro = uber ? { anotar: () => {} } : crearRegistroEventos(cuerpo);

    /* ---------- Cabecera ---------- */

    let faseMostrada = 1;
    const iconoQueCome = () => habilidades[POR_FASE[pelea.fase].icono];

    function actualizarCabecera() {
      const fase = pelea.fase;
      cabecera.mostrarFase(fase, POR_FASE[fase].descripcion + (uber ? ' Uber: come más de golpe.' : ''));
      habilidades.ouroboros.ponerContador(pelea.vientre);
      habilidades.ouroboros.cargar(pelea.carga.vientre);
      iconoQueCome().cargar(pelea.carga.comer);

      if (fase !== faseMostrada) {
        faseMostrada = fase;
        if (!uber) {
          habilidades.hambre.elemento.classList.toggle('hidden', fase === 2);
          habilidades.glotoneria.elemento.classList.toggle('hidden', fase === 1);
        }
        registro.anotar(fase === 2
          ? '¡El vientre de Jörmungandr se llenó! Ahora usa Glotonería.'
          : 'El vientre de Jörmungandr bajó: vuelve a usar Hambre.', fase === 2 ? 'jefe' : 'jugador');
      }
    }

    // Secreto: con una celda con número elegida, tocar a Ouroboros se la da de comer.
    habilidades.ouroboros.elemento.classList.add('tocable');
    habilidades.ouroboros.elemento.addEventListener('click', () => {
      if (terminada) return;
      const bocado = pelea.alimentar(juego.seleccionada);
      if (!bocado) return;
      registro.anotar(`🤫 Le diste de comer ${bocado.pista ? 'la pista' : 'el'} ${bocado.valor} a Ouroboros (+${bocado.pista ? 2 : 1} al vientre).`, 'neutro');
      habilidades.ouroboros.destello();
      actualizarCabecera();
      juego.dibujar();
    });

    /* ---------- El reloj ---------- */

    const reloj = setInterval(() => {
      if (terminada) return;
      const comida = pelea.avanzarUnSegundo();
      if (comida) {
        registro.anotar(describirBocados(comida), 'jefe');
        iconoQueCome().reiniciar();
        iconoQueCome().destello();
        habilidades.ouroboros.destello();
        juego.dibujar();
      }
      actualizarCabecera();
    }, 1000);

    /* ---------- Fin ---------- */

    async function ganar(segundos) {
      terminada = true;
      clearInterval(reloj);
      mostrarResultadoPelea({
        gano: true,
        titulo: '¡Le ganaste a Jörmungandr!',
        detalle: `Lo lograste en ${formatearSegundos(segundos)}, con ${pelea.errores} error(es).`,
        alRevancha: () => navegar('jefe-jormungandr', uber ? { uber: 1 } : {}),
      });
      mostrarLogrosNuevos(await registrarVictoriaDeJefe(idJefe, {
        segundos,
        errores: pelea.errores,
        usoNotas: pelea.usoNotas,
        alcanzoFase2: pelea.alcanzoFase2,
      }));
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
