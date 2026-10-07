// Pantalla de la pelea contra Typhon (y la uber con ?uber=1).
//
// Las reglas viven en game/jefes/typhon.js. Aquí: generar el tablero en
// segundo plano, la cabecera, el reloj de las habilidades y la animación
// de giro. Un giro se anima rotando el tablero entero 90° (con cada número
// contra-girado para que se siga leyendo derecho); al terminar se giran
// los datos y el tablero vuelve a su lugar sin animación. Como la forma es
// simétrica, el cambio no se nota.

import { RUTA_INICIO, navegar } from '../../router.js';
import { CONFIGURACION, PeleaTyphon } from '../../game/jefes/typhon.js';
import { generarEnSegundoPlano } from '../../game/multisudoku/en-segundo-plano.js';
import { JEFES } from '../../game/jefes/catalogo.js';
import { jefeDesbloqueado, registrarVictoriaDeJefe } from '../../game/jefes/registro.js';
import { leerPreferencias } from '../../preferencias.js';
import { crearJuegoSudoku } from '../../ui/juego-sudoku.js';
import { crearCabeceraJefe, habilidadDeSeccion } from '../../ui/cabecera-jefe.js';
import { crearRegistroEventos } from '../../ui/registro-eventos.js';
import { mostrarResultadoPelea } from '../../ui/resultado-pelea.js';
import { confirmarRendicion, empezarPelea } from '../../ui/pelea-en-curso.js';
import { mostrarLogrosNuevos } from '../../ui/aviso-logro.js';
import { formatearSegundos } from '../../ui/cronometro.js';

const MS_GIRO = 500; // igual que --duracion-giro en jefes.css

const DESCRIPCION = {
  normal: 'Resuelve los cuatro tableros mientras el círculo gira de un lado a otro.',
  uber: 'Forma perfecta: 5 tableros en X, todos en extremo. Giros cada 20 s, y si una caja pulsa, complétala en 10 s o ese tablero se regenera.',
};

// Nombres, iconos y cartas de las habilidades: los de su página de
// información (game/jefes/catalogo.js). La uber cambia la pasiva por su
// Forma perfecta y suma a Padre de los monstruos.
const { ataque1: DERECHA, ataque2: IZQUIERDA, pasiva: AMALGAMACION } = JEFES.typhon;
const { ataque1: FORMA_PERFECTA, ataque2: PADRE } = JEFES.typhon_uber;

const ANUNCIOS = {
  caos: ({ sentido, veces }) => `Caos a la ${sentido}: el tablero gira ${veces} ${veces === 1 ? 'vez' : 'veces'}.`,
  pulso: () => 'Padre de los monstruos: una caja empezó a pulsar. Escribe ahí un número correcto en 10 segundos.',
  salvada: () => 'Salvaste la caja a tiempo: Typhon no pudo regenerar ese tablero.',
  regenera: () => 'Se acabó el tiempo: Typhon reemplazó ese tablero por uno nuevo.',
};

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

let limpiar = () => {};
let visita = 0; // para ignorar un tablero que termina de generarse después de salir

export const pantallaTyphon = {
  titulo: 'Pelea de jefe',
  // Contra quién es la pelea (para usar su tema; ver tema.js).
  jefe: (params) => (params.get('uber') === '1' ? 'typhon_uber' : 'typhon'),
  // Salir a mitad de la pelea (rendirse) pide confirmación.
  antesDeSalir: confirmarRendicion,
  volverA: 'jefes',
  subtitulo: 'Resuelve los tableros mientras giran',

  async render(contenedor, params) {
    const uber = params.get('uber') === '1';
    const idJefe = uber ? 'typhon_uber' : 'typhon';
    if (!jefeDesbloqueado(idJefe)) {
      navegar(RUTA_INICIO);
      return;
    }
    empezarPelea();
    const estaVisita = ++visita;

    contenedor.innerHTML = '<div class="card generando"><span class="generando-icono">🌪️</span><p>Typhon está formando la tormenta…</p></div>';
    const { cantidad, pistasPorGrilla } = uber ? CONFIGURACION.uber : CONFIGURACION.normal;
    const { puzzle, solucion } = await generarEnSegundoPlano({ cantidad, pistasPorGrilla });
    if (estaVisita !== visita) return;
    contenedor.replaceChildren();

    const pelea = new PeleaTyphon({ tableroInicial: puzzle, solucion, uber });

    const cabecera = crearCabeceraJefe(contenedor, {
      id: idJefe,
      uber,
      fases: uber,
      habilidades: [
        habilidadDeSeccion('pasiva', uber ? FORMA_PERFECTA : AMALGAMACION),
        habilidadDeSeccion('derecha', DERECHA),
        habilidadDeSeccion('izquierda', IZQUIERDA),
        ...(uber ? [habilidadDeSeccion('padre', PADRE)] : []),
      ],
    });
    const { habilidades } = cabecera;
    habilidades.pasiva.cargar(1);

    const cuerpo = document.createElement('div');
    cuerpo.className = 'pelea-cuerpo';
    contenedor.appendChild(cuerpo);
    let terminada = false;

    const juego = crearJuegoSudoku(cuerpo, {
      partida: pelea,
      preferencias: leerPreferencias(),
      lugarDelCronometro: cabecera.lugarDelTiempo,
      mostrarErrores: false,
      marcas: () => ({ pulsando: new Set(pelea.pulso?.caja ?? []) }),
      alJugar: actualizarCabecera,
      alGanar: ganar,
    });
    const tablero = cuerpo.querySelector('.tablero');
    tablero.classList.add('tablero-que-gira');
    // La uber no telegrafía nada (como las demás): sin registro, y sus iconos
    // son silenciosos (la cabecera lo hace sola con uber).
    const registro = uber ? { anotar: () => {} } : crearRegistroEventos(cuerpo);

    /* ---------- Cabecera ---------- */

    let faseMostrada = 1;

    function actualizarCabecera() {
      const fase = pelea.fase;
      cabecera.mostrarFase(fase, DESCRIPCION[uber ? 'uber' : 'normal']);
      if (uber && fase !== faseMostrada) {
        faseMostrada = fase;
        registro.anotar(fase === 2
          ? 'Fase 2: ya llenaste la mitad. Padre de los monstruos ahora ataca cada minuto.'
          : 'Una regeneración te devolvió a la fase 1.', 'jefe');
      }
      habilidades.derecha.cargar(pelea.carga.derecha);
      habilidades.izquierda.cargar(pelea.carga.izquierda);
      habilidades.padre?.cargar(pelea.carga.padre);
    }

    /* ---------- Giros ---------- */

    let girando = false;

    // Anima y aplica los giros pendientes, uno por uno.
    async function girarPendientes() {
      if (girando) return;
      girando = true;
      for (let sentido = pelea.siguienteGiro(); sentido && !terminada; sentido = pelea.siguienteGiro()) {
        tablero.classList.add('girando', `girando-${sentido}`);
        await esperar(MS_GIRO);
        if (terminada) break;
        pelea.girar(sentido);
        const seleccionada = juego.seleccionada;
        tablero.classList.remove('girando', `girando-${sentido}`);
        void tablero.offsetWidth; // que la vuelta a su lugar no se anime
        juego.seleccionar(seleccionada === null ? null : pelea.indiceGirado(seleccionada, sentido));
      }
      girando = false;
    }

    /* ---------- El reloj ---------- */

    const ICONO_DE_EVENTO = { pulso: 'padre', regenera: 'padre' };

    const reloj = setInterval(() => {
      if (terminada) return;
      for (const evento of pelea.avanzarUnSegundo()) {
        registro.anotar(ANUNCIOS[evento.tipo](evento), evento.tipo === 'salvada' ? 'jugador' : 'jefe');
        const icono = habilidades[evento.tipo === 'caos' ? evento.sentido : ICONO_DE_EVENTO[evento.tipo]];
        icono?.destello();
      }
      actualizarCabecera();
      juego.dibujar();
      girarPendientes();
    }, 1000);

    /* ---------- Fin ---------- */

    async function ganar(segundos) {
      terminada = true;
      clearInterval(reloj);
      mostrarResultadoPelea({
        gano: true,
        titulo: uber ? '¡Le ganaste a Typhon (Uber)!' : '¡Le ganaste a Typhon!',
        detalle: `Lo lograste en ${formatearSegundos(segundos)}, con ${pelea.errores} error(es).`,
        alRevancha: () => navegar('jefe-typhon', uber ? { uber: 1 } : {}),
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
    visita++;
    limpiar();
    limpiar = () => {};
  },
};
