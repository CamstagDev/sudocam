// Pantalla de la pelea contra Babel: #/jefe-babel?dificultad=medio (y
// &uber=1 para la uber).
//
// Las reglas viven en game/jefes/babel.js. Aquí: la cabecera, el
// cronómetro, el registro, y pasarle al tablero y al teclado los símbolos.

import { RUTA_INICIO, navegar } from '../../router.js';
import { DIFICULTADES } from '../../game/sudoku/dificultades.js';
import { generarPuzzle } from '../../game/sudoku/generador.js';
import { PeleaBabel } from '../../game/jefes/babel.js';
import { CAJAS } from '../../game/sudoku/geometria-9x9.js';
import { JEFES } from '../../game/jefes/catalogo.js';
import { jefeDesbloqueado, registrarVictoriaDeJefe } from '../../game/jefes/registro.js';
import { leerPreferencias } from '../../preferencias.js';
import { crearJuegoSudoku } from '../../ui/juego-sudoku.js';
import { crearCabeceraJefe } from '../../ui/cabecera-jefe.js';
import { crearRegistroEventos } from '../../ui/registro-eventos.js';
import { mostrarResultadoPelea } from '../../ui/resultado-pelea.js';
import { mostrarLogrosNuevos } from '../../ui/aviso-logro.js';
import { formatearSegundos } from '../../ui/cronometro.js';

export const DIFICULTADES_BABEL = ['facil', 'medio', 'dificil'];

let limpiar = () => {};

export const pantallaBabel = {
  titulo: 'Pelea de jefe',
  subtitulo: 'Resuelve el sudoku en un idioma que no conoces',

  render(contenedor, params) {
    const uber = params.get('uber') === '1';
    const idJefe = uber ? 'babel_uber' : 'babel';
    const dificultad = DIFICULTADES_BABEL.includes(params.get('dificultad')) ? params.get('dificultad') : 'facil';
    if (!jefeDesbloqueado(idJefe)) {
      navegar(RUTA_INICIO);
      return;
    }

    const { puzzle, solucion } = generarPuzzle(DIFICULTADES[dificultad].pistas);
    const pelea = new PeleaBabel({ tableroInicial: puzzle, solucion, dificultad, uber });

    const cabecera = crearCabeceraJefe(contenedor, {
      id: idJefe,
      uber,
      mostrarHabilidades: true,
      fases: false,
      habilidades: [
        { id: 'simbolos', emoji: '&%', nombre: '&%?#' },
        { id: 'evolucion', emoji: '🔀', nombre: 'La lengua evoluciona' },
      ],
    });
    cabecera.mostrarFase(1, `${JEFES.babel.descripcion} Dificultad: ${DIFICULTADES[dificultad].nombre}.`
      + (uber ? ' Torre de Babel: tres alfabetos a la vez; el color de cada caja dice cuál usa.' : ''));
    cabecera.habilidades.simbolos.cargar(1); // pasiva siempre activa

    const cuerpo = document.createElement('div');
    cuerpo.className = 'pelea-cuerpo';
    contenedor.appendChild(cuerpo);
    let evolucionesAnunciadas = 0;

    const juego = crearJuegoSudoku(cuerpo, {
      partida: pelea,
      preferencias: leerPreferencias(),
      mostrarErrores: false,
      insignias: [DIFICULTADES[dificultad].nombre],
      teclasNumericas: false, // si el teclado escribiera números, los símbolos no servirían de nada
      simbolo: (indice, digito) => pelea.simboloDe(indice, digito),
      filasTeclado: () => pelea.filasDelTeclado(),
      // Uber: cada caja se tiñe con el color de su alfabeto.
      marcas: () => {
        if (!uber) return {};
        const marcas = { 'alfabeto-0': new Set(), 'alfabeto-1': new Set(), 'alfabeto-2': new Set() };
        CAJAS.forEach((caja, numero) => caja.forEach((indice) => marcas[`alfabeto-${pelea.alfabetoDeCaja[numero]}`].add(indice)));
        return marcas;
      },
      accionesExtra: [{ texto: 'Rendirse', alTocar: () => navegar(RUTA_INICIO) }],
      alJugar: () => {
        if (pelea.evoluciones === evolucionesAnunciadas) return;
        evolucionesAnunciadas = pelea.evoluciones;
        registro.anotar(uber
          ? 'La lengua evoluciona: símbolos nuevos, y las cajas cambiaron de alfabeto.'
          : 'La lengua evoluciona: todos los símbolos cambiaron de golpe.', 'jefe');
        cabecera.habilidades.evolucion.destello();
      },
      alGanar: ganar,
    });
    cuerpo.querySelector('.juego').classList.toggle('juego-babel-uber', uber);

    const registro = crearRegistroEventos(cuerpo);

    async function ganar(segundos) {
      mostrarResultadoPelea({
        gano: true,
        titulo: uber ? '¡Le ganaste a Babel (Uber)!' : '¡Le ganaste a Babel!',
        detalle: `Lo lograste en ${formatearSegundos(segundos)}, con ${pelea.errores} error(es), en ${DIFICULTADES[dificultad].nombre.toLowerCase()}.`,
        alRevancha: () => navegar('jefe-babel', Object.fromEntries(params)),
      });
      mostrarLogrosNuevos(await registrarVictoriaDeJefe(idJefe, {
        segundos,
        errores: pelea.errores,
        usoNotas: pelea.usoNotas,
        dificultadElegida: dificultad,
      }));
    }

    limpiar = () => juego.destruir();
  },

  destruir() {
    limpiar();
    limpiar = () => {};
  },
};
