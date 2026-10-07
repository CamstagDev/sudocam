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
//     alGanar: (segundos) => ...,          tablero completo y correcto
//
//     Opcionales, para los jefes:
//     mostrarErrores: false,               sin el contador de errores
//     marcas: () => ({ clase: Set }),      clases extra por celda (ver vista-tablero.js)
//     alJugar: ({ indice, valor, correcto }) => ...,   después de cada número escrito
//     disfraz: () => ({ valores: Map, fijas: Set, notas: Map }),   lo que se ve distinto de la
//                                          realidad (Hecate; ver PeleaHecate.disfraz)
//     estadoTeclado: () => ({ bloqueados: Set, cargando: Map }),   ver teclado-numerico.js
//     mostrarCronometro: false,            cuando el jefe tiene su propio reloj
//     lugarDelCronometro: elemento,        dónde va el cronómetro, en vez de la barra
//                                          (la cabecera del jefe)
//     simbolo: (indice, digito) => texto,  cómo se escribe cada dígito (Babel)
//     filasTeclado: () => filas,           botones del teclado (ver teclado-numerico.js)
//     teclasNumericas: false,              el teclado físico no escribe números (Babel)
//
//     Opcional, para el tutorial:
//     puedeJugar: ({ indice, digito, notas }) => boolean,   false = la jugada no se hace
//                                          (digito 0 = borrar)
//   });
//   juego.mostrarMensaje('Texto', 'error' | 'exito');
//   juego.dibujar();    redibujar si la partida cambió desde afuera (p. ej. jugó el jefe)
//   juego.seleccionada / juego.seleccionar(indice)
//   juego.detenerCronometro(); juego.reanudarCronometro();
//   juego.destruir();   al salir de la pantalla

import { celdaEnDireccion } from '../game/sudoku/lienzo.js';
import { DIGITOS } from '../game/sudoku/tablero.js';
import { crearVistaTablero } from './vista-tablero.js';
import { activarZoom } from './zoom-tablero.js';
import { crearTecladoNumerico } from './teclado-numerico.js';
import { crearCronometro, formatearSegundos } from './cronometro.js';

export function crearJuegoSudoku(contenedor, {
  partida,
  preferencias,
  insignias = [],
  accionesExtra = [],
  alGanar = () => {},
  mostrarErrores = true,
  marcas = () => ({}),
  alJugar = () => {},
  disfraz = () => ({ valores: new Map(), fijas: new Set(), notas: new Map() }),
  estadoTeclado = () => ({}),
  mostrarCronometro = preferencias.mostrarCronometro,
  lugarDelCronometro = null,
  simbolo = undefined,
  filasTeclado = null,
  teclasNumericas = true,
  puedeJugar = () => true,
}) {
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
  badgeErrores.classList.toggle('hidden', !mostrarErrores || partida.politicaErrores === 'final');
  cronometroEl.classList.toggle('hidden', !mostrarCronometro);
  if (lugarDelCronometro) lugarDelCronometro.appendChild(cronometroEl);

  const botonesExtra = accionesExtra.map(({ texto, alTocar }) => {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'btn btn-secondary btn-sm';
    boton.textContent = texto;
    boton.addEventListener('click', alTocar);
    barraAcciones.appendChild(boton);
    return boton;
  });

  // Sin nada que mostrar (p. ej. en una pelea con el cronómetro en la
  // cabecera), la barra no ocupa lugar.
  const barra = tarjeta.querySelector('.barra-juego');
  barra.classList.toggle('hidden', ![...barra.querySelectorAll('.badge, .cronometro, .btn')]
    .some((pieza) => !pieza.classList.contains('hidden')));

  let seleccionada = null;
  let modoNotas = false;
  let terminado = false;

  /* ---------- Piezas ---------- */

  const vista = crearVistaTablero(tarjeta.querySelector('.tablero-contenedor'), {
    lienzo: partida.lienzo,
    alTocarCelda: (indice) => {
      seleccionada = indice;
      dibujar();
    },
  });

  // Los tableros grandes (multi sudoku, Typhon) se pueden acercar.
  if (partida.lienzo.cantidadGrillas > 1) activarZoom(tarjeta.querySelector('.tablero-contenedor'));

  const teclado = crearTecladoNumerico(tarjeta, {
    alElegirDigito: escribir,
    alBorrar: borrar,
    alAlternarNotas: partida.permitirNotas === false ? null : alternarModoNotas,
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
    if (seleccionada === null || !puedeJugar({ indice: seleccionada, digito, notas: modoNotas })) return;
    const cambio = modoNotas ? partida.alternarNota(seleccionada, digito) : partida.colocar(seleccionada, digito);
    if (!cambio) return;

    ocultarMensaje();
    if (!modoNotas && partida.politicaErrores === 'final' && partida.estaLleno && !partida.resuelta) {
      mostrarMensaje('El tablero está completo pero hay errores', 'error');
    }
    dibujar();
    if (!modoNotas) alJugar({ indice: seleccionada, valor: digito, correcto: digito === partida.solucion[seleccionada] });
    if (partida.resuelta) ganar();
  }

  function borrar() {
    if (seleccionada === null || !puedeJugar({ indice: seleccionada, digito: 0 })) return;
    if (!partida.borrar(seleccionada)) return;
    ocultarMensaje();
    dibujar();
  }

  function alternarModoNotas() {
    if (partida.permitirNotas === false) return;
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
    if (terminado) return;
    terminado = true;
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
    } else if (teclasNumericas && tecla >= '1' && tecla <= '9') {
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

  // Babel cambia los botones cuando "evoluciona": solo se rehacen si cambiaron.
  let filasDibujadas = '';
  function rearmarTecladoSiCambio(filas) {
    const clave = JSON.stringify(filas);
    if (clave === filasDibujadas) return;
    filasDibujadas = clave;
    teclado.rearmar(filas);
  }

  function dibujar() {
    // Lo que se muestra puede no ser la verdad (engaños de Hecate).
    const { valores, fijas, notas } = disfraz();
    vista.dibujar({
      tablero: partida.tablero.map((valor, indice) => valores.get(indice) ?? valor),
      fijas: partida.tableroInicial.map((valor, indice) => valor !== 0 || fijas.has(indice)),
      notas: partida.notas,
      notasFalsas: notas,
      errores: partida.erroresVisibles,
      seleccionada,
      resaltarRelacionadas: preferencias.resaltarRelacionadas,
      resaltarIguales: preferencias.resaltarIguales,
      marcas: marcas(),
      simbolo,
    });
    if (filasTeclado) rearmarTecladoSiCambio(filasTeclado());
    teclado.dibujar({
      digitosCompletos: new Set(DIGITOS.filter((digito) => partida.digitoCompleto(digito))),
      modoNotas,
      ...estadoTeclado(),
    });
    badgeErrores.textContent = `Errores: ${partida.errores}`;
  }

  /* ---------- Arranque ---------- */

  btnComprobar.addEventListener('click', comprobar);
  document.addEventListener('keydown', alPresionarTecla);
  dibujar();
  cronometro.iniciar();

  // Si la partida termina por algo de afuera (p. ej. el jefe puso el
  // último número), avisar igual.
  function revisarFin() {
    dibujar();
    if (partida.resuelta) ganar();
  }

  return {
    mostrarMensaje,
    dibujar: revisarFin,
    get seleccionada() {
      return seleccionada;
    },
    // Mover la selección desde afuera (Typhon la mueve al girar el tablero).
    seleccionar(indice) {
      seleccionada = indice;
      dibujar();
    },
    detenerCronometro: () => cronometro.detener(),
    reanudarCronometro: () => cronometro.iniciar(),
    destruir() {
      cronometro.detener();
      document.removeEventListener('keydown', alPresionarTecla);
    },
  };
}
