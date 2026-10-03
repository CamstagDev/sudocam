// Pantalla del sudoku 9x9 clásico.
//
// Recibe la dificultad por la ruta: #/sudoku?dificultad=medio, o para el
// modo personalizado #/sudoku?dificultad=personalizado&pistas=30&politicaErrores=boton
//
// La lógica de la partida vive en game/sudoku/partida.js; esta pantalla
// solo arma el HTML, traduce clics y teclas en jugadas y redibuja.

import { RUTA_INICIO, navegar } from '../router.js';
import { DIFICULTADES, POLITICAS_ERRORES, limitarPistasPersonalizado } from '../game/sudoku/dificultades.js';
import { generarPuzzle } from '../game/sudoku/generador.js';
import { PartidaSudoku } from '../game/sudoku/partida.js';
import { DIGITOS, TAMANO, columnaDe, estaCompleto, filaDe, indiceDe } from '../game/sudoku/tablero.js';
import { crearVistaTablero } from '../ui/vista-tablero.js';
import { crearTecladoNumerico } from '../ui/teclado-numerico.js';
import { crearCronometro, formatearSegundos } from '../ui/cronometro.js';
import { leerPreferencias } from '../preferencias.js';

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

// Lo que hay que limpiar al salir de la pantalla (ver destruir()).
let limpiarPantalla = () => {};

export const pantallaSudoku = {
  titulo: 'Sudoku 9x9',
  subtitulo: (params) => `Dificultad: ${DIFICULTADES[leerConfiguracion(params).dificultad].nombre}`,

  render(contenedor, params) {
    const configuracion = leerConfiguracion(params);
    const partida = crearPartidaNueva(configuracion);
    const preferencias = leerPreferencias();

    let seleccionada = null;
    let modoNotas = false;

    contenedor.innerHTML = `
      <div class="banner" id="banner"></div>

      <section class="card victoria hidden" id="victoria">
        <span class="victoria-icono">🎉</span>
        <h2>¡Sudoku resuelto!</h2>
        <p class="campo-ayuda" id="victoria-tiempo"></p>
        <div class="fila-acciones">
          <button type="button" class="btn btn-primary" id="btn-otra-vez">Jugar otra vez</button>
          <button type="button" class="btn btn-secondary" id="btn-menu">Volver al menú</button>
        </div>
      </section>

      <section class="card juego">
        <div class="barra-juego">
          <div class="barra-juego-info">
            <span class="badge acento">${DIFICULTADES[partida.dificultad].nombre}</span>
            <span class="badge negativo" id="badge-errores"></span>
            <span class="cronometro" id="cronometro"></span>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-comprobar">Comprobar</button>
        </div>
        <div class="tablero-contenedor" id="tablero-contenedor"></div>
        <div id="teclado-contenedor"></div>
      </section>
    `;

    const banner = contenedor.querySelector('#banner');
    const badgeErrores = contenedor.querySelector('#badge-errores');
    const cronometroEl = contenedor.querySelector('#cronometro');
    const btnComprobar = contenedor.querySelector('#btn-comprobar');
    const victoria = contenedor.querySelector('#victoria');

    // Con "boton" hace falta el botón Comprobar; con "final" no hay errores
    // que contar hasta el final, así que el contador solo confundiría.
    btnComprobar.classList.toggle('hidden', partida.politicaErrores !== 'boton');
    badgeErrores.classList.toggle('hidden', partida.politicaErrores === 'final');
    cronometroEl.classList.toggle('hidden', !preferencias.mostrarCronometro);

    /* ---------- Componentes ---------- */

    const vista = crearVistaTablero(contenedor.querySelector('#tablero-contenedor'), {
      alTocarCelda: (indice) => {
        seleccionada = indice;
        dibujar();
      },
    });

    const teclado = crearTecladoNumerico(contenedor.querySelector('#teclado-contenedor'), {
      alElegirDigito: escribir,
      alBorrar: borrar,
      alAlternarNotas: alternarModoNotas,
    });

    const cronometro = crearCronometro({
      segundosIniciales: partida.segundos,
      alCambiar: (segundos) => {
        partida.segundos = segundos;
        cronometroEl.textContent = formatearSegundos(segundos);
      },
    });

    /* ---------- Mensajes ---------- */

    function mostrarMensaje(texto, tipo) {
      banner.textContent = texto;
      banner.className = `banner visible ${tipo}`;
    }

    function ocultarMensaje() {
      banner.className = 'banner';
    }

    /* ---------- Jugadas ---------- */

    function escribir(digito) {
      if (seleccionada === null) return;
      const cambio = modoNotas ? partida.alternarNota(seleccionada, digito) : partida.colocar(seleccionada, digito);
      if (!cambio) return;

      ocultarMensaje();
      if (!modoNotas && partida.politicaErrores === 'final' && estaCompleto(partida.tablero) && !partida.resuelta) {
        mostrarMensaje('El tablero está completo pero hay errores', 'error');
      }
      dibujar();
      if (partida.resuelta) ganar();
    }

    function borrar() {
      if (seleccionada === null || !partida.borrar(seleccionada)) return;
      ocultarMensaje();
      dibujar();
    }

    function alternarModoNotas() {
      modoNotas = !modoNotas;
      dibujar();
    }

    function comprobar() {
      partida.comprobar();
      if (partida.erroresVisibles.size > 0) {
        mostrarMensaje('Hay números que no van ahí', 'error');
      } else if (!partida.resuelta) {
        mostrarMensaje('Vas bien: no hay errores por ahora', 'exito');
      }
      dibujar();
    }

    // Flechas: mover la selección sin salirse del tablero.
    function moverSeleccion(tecla) {
      if (seleccionada === null) {
        seleccionada = 0;
        return;
      }
      const limitar = (n) => Math.min(TAMANO - 1, Math.max(0, n));
      let fila = filaDe(seleccionada);
      let columna = columnaDe(seleccionada);
      if (tecla === 'ArrowUp') fila = limitar(fila - 1);
      if (tecla === 'ArrowDown') fila = limitar(fila + 1);
      if (tecla === 'ArrowLeft') columna = limitar(columna - 1);
      if (tecla === 'ArrowRight') columna = limitar(columna + 1);
      seleccionada = indiceDe(fila, columna);
    }

    function alPresionarTecla(evento) {
      if (document.querySelector('.modal-fondo')) return; // hay un modal abierto encima
      const tecla = evento.key;

      if (tecla === 'n' || tecla === 'N') {
        alternarModoNotas();
      } else if (tecla >= '1' && tecla <= '9') {
        escribir(Number(tecla));
      } else if (tecla === 'Backspace' || tecla === 'Delete' || tecla === '0') {
        borrar();
      } else if (tecla.startsWith('Arrow')) {
        evento.preventDefault();
        moverSeleccion(tecla);
        dibujar();
      }
    }

    /* ---------- Victoria ---------- */

    function ganar() {
      cronometro.detener();
      seleccionada = null;
      dibujar();
      contenedor.querySelector('#victoria-tiempo').textContent = `Lo lograste en ${formatearSegundos(cronometro.segundos)}`;
      victoria.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /* ---------- Dibujo ---------- */

    function dibujar() {
      vista.dibujar({
        tablero: partida.tablero,
        fijas: partida.tableroInicial.map((valor) => valor !== 0),
        notas: partida.notas,
        errores: partida.erroresVisibles,
        seleccionada,
        resaltarRelacionadas: preferencias.resaltarRelacionadas,
        resaltarIguales: preferencias.resaltarIguales,
      });
      teclado.dibujar({
        digitosCompletos: new Set(DIGITOS.filter((digito) => partida.digitoCompleto(digito))),
        modoNotas,
      });
      badgeErrores.textContent = partida.erroresRevisados ? `Errores: ${partida.erroresVisibles.size}` : 'Errores: –';
    }

    /* ---------- Arranque ---------- */

    btnComprobar.addEventListener('click', comprobar);
    contenedor.querySelector('#btn-otra-vez').addEventListener('click', () => navegar('sudoku', Object.fromEntries(params)));
    contenedor.querySelector('#btn-menu').addEventListener('click', () => navegar(RUTA_INICIO));
    document.addEventListener('keydown', alPresionarTecla);

    limpiarPantalla = () => {
      cronometro.detener();
      document.removeEventListener('keydown', alPresionarTecla);
    };

    dibujar();
    cronometro.iniciar();
  },

  destruir() {
    limpiarPantalla();
    limpiarPantalla = () => {};
  },
};
