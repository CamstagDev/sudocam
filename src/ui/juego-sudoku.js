// La tarjeta de juego que comparten el sudoku, el multi sudoku y los
// jefes: barra con insignias, errores y cronómetro, el tablero, el teclado
// numérico, las notas y los atajos de teclado.
//
// Traduce clics y teclas en jugadas sobre una PartidaSudoku y redibuja.
// Lo propio de cada pantalla (pausar, qué pasa al ganar...) llega por
// las opciones.
//
//   const juego = crearJuegoSudoku(contenedor, {
//     partida,                                   ver game/sudoku/partida.js
//     preferencias,                              ver preferencias.js
//     insignias: ['Fácil', '2 tableros'],
//     accionesExtra: [{ texto: '⏸ Pausar y guardar', alTocar: () => ... }],
//     alGanar: (segundos) => ...,
//   });
//   juego.mostrarMensaje('Texto', 'error' | 'exito');
//   juego.detenerCronometro(); juego.reanudarCronometro();
//   juego.destruir();   al salir de la pantalla

import { celdaEnDireccion } from '../game/sudoku/lienzo.js';
import { DIGITOS } from '../game/sudoku/tablero.js';
import { crearVistaTablero } from './vista-tablero.js';
import { crearTecladoNumerico } from './teclado-numerico.js';
import { crearCronometro, formatearSegundos } from './cronometro.js';

export function crearJuegoSudoku(contenedor, { partida, preferencias, insignias = [], accionesExtra = [], alGanar = () => {} }) {
  const tarjeta = document.createElement('section');
  tarjeta.className = 'card juego';
  tarjeta.innerHTML = `
    <div class="banner"></div>
    <div class="barra-juego">
      <div class="barra-juego-info">
        ${insignias.map((texto) => `<span class="badge acento">${texto}</span>`).join('')}
        <span class="badge negativo" data-id="errores"></span>
        <span class="cronometro" data-id="cronometro"></span>
      </div>
      <div class="barra-juego-acciones">
        <button type="button" class="btn btn-secondary btn-sm" data-id="comprobar">Comprobar</button>
      </div>
    </div>
    <div class="tablero-contenedor"></div>
  `;
  contenedor.appendChild(tarjeta);

  const elemento = (id) => tarjeta.querySelector(`[data-id="${id}"]`);
  const banner = tarjeta.querySelector('.banner');
  const badgeErrores = elemento('errores');
  const cronometroEl = elemento('cronometro');
  const btnComprobar = elemento('comprobar');
  const barraAcciones = tarjeta.querySelector('.barra-juego-acciones');

  // Con "boton" hace falta Comprobar; con "final" no hay errores que
  // contar hasta el final, así que el contador solo confundiría.
  btnComprobar.classList.toggle('hidden', partida.politicaErrores !== 'boton');
  badgeErrores.classList.toggle('hidden', partida.politicaErrores === 'final');
  cronometroEl.classList.toggle('hidden', !preferencias.mostrarCronometro);

  const botonesExtra = accionesExtra.map(({ texto, alTocar }) => {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'btn btn-secondary btn-sm';
    boton.textContent = texto;
    boton.addEventListener('click', alTocar);
    barraAcciones.appendChild(boton);
    return boton;
  });

  let seleccionada = null;
  let modoNotas = false;

  /* ---------- Piezas ---------- */

  const vista = crearVistaTablero(tarjeta.querySelector('.tablero-contenedor'), {
    lienzo: partida.lienzo,
    alTocarCelda: (indice) => {
      seleccionada = indice;
      dibujar();
    },
  });

  const teclado = crearTecladoNumerico(tarjeta, {
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
    if (!modoNotas && partida.politicaErrores === 'final' && partida.estaLleno && !partida.resuelta) {
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

  function ganar() {
    cronometro.detener();
    seleccionada = null;
    botonesExtra.forEach((boton) => boton.classList.add('hidden'));
    dibujar();
    alGanar(cronometro.segundos);
  }

  /* ---------- Teclado físico ---------- */

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
      seleccionada = seleccionada === null
        ? partida.lienzo.celdas[0]
        : celdaEnDireccion(partida.lienzo, seleccionada, tecla);
      dibujar();
    }
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
    badgeErrores.textContent = `Errores: ${partida.errores}`;
  }

  /* ---------- Arranque ---------- */

  btnComprobar.addEventListener('click', comprobar);
  document.addEventListener('keydown', alPresionarTecla);
  dibujar();
  cronometro.iniciar();

  return {
    mostrarMensaje,
    detenerCronometro: () => cronometro.detener(),
    reanudarCronometro: () => cronometro.iniciar(),
    destruir() {
      cronometro.detener();
      document.removeEventListener('keydown', alPresionarTecla);
    },
  };
}
