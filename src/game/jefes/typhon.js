// Typhon, el jefe de los multi sudoku.
//
//  - Amalgamación (pasiva): 4 tableros en círculo, dos en difícil y dos
//    en extremo, alternados para que cada esquina compartida mezcle las
//    dos dificultades.
//  - Caos a la derecha (cada 45-60 s) / a la izquierda (cada 30-45 s):
//    gira el círculo entero de 1 a 4 veces. Si coinciden, se turnan un
//    giro cada uno. La forma es simétrica, así que cada celda cae sobre
//    otra celda; lo que cambia es de dónde vino cada número.
//  - Uber, "Forma perfecta": 5 tableros en X, todos en extremo, giros
//    cada 20 s, sin notas, y "Padre de los monstruos": cada 2 minutos (1
//    en fase 2) una caja de un tablero exterior pulsa; si en 10 s no
//    escribes ahí un número correcto, ese tablero se reemplaza por uno
//    nuevo. La fase 2 llega al llenar la mitad de las casillas que no
//    eran pistas, y una regeneración puede bajarla de nuevo.
//
// Aquí solo están las reglas; la pantalla (con la animación de giro) está
// en screens/jefes/typhon.js.

import { mezclar } from '../sudoku/azar.js';
import { generarPuzzle } from '../sudoku/generador.js';
import { LIENZO_9X9, TAMANO_CAJA, TAMANO_GRILLA } from '../sudoku/lienzo.js';
import { DIFICULTADES } from '../sudoku/dificultades.js';
import { celdasIncorrectas } from '../sudoku/tablero.js';
import { FORMAS, lienzoDeForma } from '../multisudoku/formas.js';
import { PartidaDeJefe } from './partida-de-jefe.js';

export const PISTAS_EXTREMO = 20;

export const CONFIGURACION = {
  normal: {
    cantidad: 4,
    pistasPorGrilla: [DIFICULTADES.dificil.pistas, PISTAS_EXTREMO, DIFICULTADES.dificil.pistas, PISTAS_EXTREMO],
    esperaDerecha: [45, 60],
    esperaIzquierda: [30, 45],
  },
  uber: {
    cantidad: 5,
    pistasPorGrilla: PISTAS_EXTREMO,
    esperaDerecha: [20, 20],
    esperaIzquierda: [20, 20],
  },
};

const GRILLA_CENTRAL_X = 2; // en la forma de X, la del medio
const ESPERA_PADRE = { 1: 120, 2: 60 };
const SEGUNDOS_PULSO = 10;
const UMBRAL_FASE_2 = 0.5;

const entre = ([minimo, maximo]) => minimo + Math.floor(Math.random() * (maximo - minimo + 1));

export class PeleaTyphon extends PartidaDeJefe {
  // `tableroInicial` y `solucion` vienen del generador de multi sudoku con
  // CONFIGURACION[normal|uber].
  constructor({ tableroInicial, solucion, uber = false }) {
    const configuracion = uber ? CONFIGURACION.uber : CONFIGURACION.normal;
    super({
      dificultad: 'dificil',
      tableroInicial,
      solucion,
      lienzo: lienzoDeForma(configuracion.cantidad),
      permitirNotas: !uber,
    });
    this.uber = uber;
    this.configuracion = configuracion;
    this.alcanzoFase2 = false;

    this.esperaDerecha = entre(configuracion.esperaDerecha);
    this.esperaIzquierda = entre(configuracion.esperaIzquierda);
    this.duracionDerecha = this.esperaDerecha;
    this.duracionIzquierda = this.esperaIzquierda;
    this.girosPendientes = { derecha: 0, izquierda: 0 };
    this.ultimoGiro = null;

    this.esperaPadre = ESPERA_PADRE[1];
    this.pulso = null; // { caja: [índices], quedan }
  }

  // Los errores se ven al instante.
  actualizarErroresVisibles() {
    this.erroresVisibles = celdasIncorrectas(this.tablero, this.solucion, this.lienzo);
    this.erroresRevisados = true;
  }

  // Solo la uber tiene fases. No es de un solo sentido: una regeneración
  // puede volver a bajarla.
  get fase() {
    if (!this.uber) return 1;
    const libres = this.lienzo.celdas.filter((indice) => !this.esFija(indice));
    const llenas = libres.filter((indice) => this.tablero[indice] !== 0).length;
    const fase = llenas / libres.length >= UMBRAL_FASE_2 ? 2 : 1;
    if (fase === 2) this.alcanzoFase2 = true;
    return fase;
  }

  /* ---------- Giros ---------- */

  // A dónde va la celda `indice` al girar el lienzo 90° (es cuadrado).
  indiceGirado(indice, sentido) {
    const lado = this.lienzo.ancho;
    const fila = Math.floor(indice / lado);
    const columna = indice % lado;
    return sentido === 'derecha' ? columna * lado + (lado - 1 - fila) : (lado - 1 - columna) * lado + fila;
  }

  // Gira los datos de la partida: números, solución, pistas, notas.
  girar(sentido) {
    const mover = (arreglo, vacio) => {
      const nuevo = new Array(arreglo.length).fill(vacio);
      for (const indice of this.lienzo.celdas) nuevo[this.indiceGirado(indice, sentido)] = arreglo[indice];
      return nuevo;
    };
    this.tablero = mover(this.tablero, 0);
    this.solucion = mover(this.solucion, 0);
    this.tableroInicial = mover(this.tableroInicial, 0);
    this.notas = mover(this.notas, null).map((notas) => notas ?? new Set());
    this.yaContadas = new Set([...this.yaContadas].map((indice) => this.indiceGirado(indice, sentido)));
    if (this.pulso) this.pulso.caja = this.pulso.caja.map((indice) => this.indiceGirado(indice, sentido));
    this.actualizarErroresVisibles();
  }

  // El próximo giro de la fila: si hay pendientes de los dos lados, se
  // turnan (derecha, izquierda, derecha...). null si no queda ninguno.
  siguienteGiro() {
    const { derecha, izquierda } = this.girosPendientes;
    if (derecha === 0 && izquierda === 0) return null;
    let sentido = derecha > 0 ? 'derecha' : 'izquierda';
    if (derecha > 0 && izquierda > 0) sentido = this.ultimoGiro === 'derecha' ? 'izquierda' : 'derecha';
    this.girosPendientes[sentido]--;
    this.ultimoGiro = sentido;
    return sentido;
  }

  /* ---------- Padre de los monstruos (uber) ---------- */

  // Las cajas de los tableros exteriores que todavía tienen algo vacío.
  cajasQueSePuedenAmenazar() {
    const cajas = [];
    FORMAS[5].origenes.forEach((origen, grilla) => {
      if (grilla === GRILLA_CENTRAL_X) return;
      for (let filaCaja = 0; filaCaja < TAMANO_GRILLA; filaCaja += TAMANO_CAJA) {
        for (let columnaCaja = 0; columnaCaja < TAMANO_GRILLA; columnaCaja += TAMANO_CAJA) {
          const caja = [];
          for (let f = 0; f < TAMANO_CAJA; f++) {
            for (let c = 0; c < TAMANO_CAJA; c++) {
              caja.push((origen.fila + filaCaja + f) * this.lienzo.ancho + origen.columna + columnaCaja + c);
            }
          }
          if (caja.some((indice) => this.tablero[indice] === 0)) cajas.push(caja);
        }
      }
    });
    return cajas;
  }

  colocar(indice, valor) {
    if (!super.colocar(indice, valor)) return false;
    // Un número correcto en la caja que pulsa la salva.
    if (this.pulso?.caja.includes(indice) && valor === this.solucion[indice]) {
      this.pulso = null;
      this.pulsoSalvado = true;
    }
    return true;
  }

  // Reemplaza el tablero exterior que contiene `caja` por uno nuevo. La
  // caja que comparte con el del medio se queda igual, para que sigan
  // enganchados.
  regenerarTableroDe(caja) {
    const grilla = this.lienzo.ubicaciones[caja[0]].find((lugar) => lugar.grilla !== GRILLA_CENTRAL_X).grilla;
    const origen = FORMAS[5].origenes[grilla];
    const aLienzo = (local) => (origen.fila + Math.floor(local / 9)) * this.lienzo.ancho + origen.columna + (local % 9);
    const compartida = (local) => this.lienzo.ubicaciones[aLienzo(local)].length > 1;

    const fijas = LIENZO_9X9.celdas.map((local) => (compartida(local) ? this.solucion[aLienzo(local)] : 0));
    const { puzzle, solucion } = generarPuzzle(PISTAS_EXTREMO, { fijas });

    for (const local of LIENZO_9X9.celdas) {
      if (compartida(local)) continue; // eso es del tablero del medio
      const indice = aLienzo(local);
      this.solucion[indice] = solucion[local];
      this.tableroInicial[indice] = puzzle[local];
      this.tablero[indice] = puzzle[local];
      this.notas[indice] = new Set();
      this.yaContadas.delete(indice);
    }
    this.actualizarErroresVisibles();
    return grilla;
  }

  /* ---------- El reloj ---------- */

  // Avanza un segundo. Devuelve los eventos que pasaron:
  //   { tipo: 'caos', sentido, veces } | { tipo: 'pulso' } | { tipo: 'salvada' } | { tipo: 'regenera' }
  avanzarUnSegundo() {
    const eventos = [];

    if (this.pulsoSalvado) {
      this.pulsoSalvado = false;
      eventos.push({ tipo: 'salvada' });
    }

    for (const sentido of ['derecha', 'izquierda']) {
      const espera = sentido === 'derecha' ? 'esperaDerecha' : 'esperaIzquierda';
      if (--this[espera] <= 0) {
        const veces = entre([1, 4]);
        this.girosPendientes[sentido] += veces;
        eventos.push({ tipo: 'caos', sentido, veces });
        this[espera] = entre(sentido === 'derecha' ? this.configuracion.esperaDerecha : this.configuracion.esperaIzquierda);
        this[sentido === 'derecha' ? 'duracionDerecha' : 'duracionIzquierda'] = this[espera];
      }
    }

    if (this.uber) {
      if (this.pulso) {
        if (--this.pulso.quedan <= 0) {
          this.regenerarTableroDe(this.pulso.caja);
          this.pulso = null;
          eventos.push({ tipo: 'regenera' });
        }
      } else if (--this.esperaPadre <= 0) {
        this.esperaPadre = ESPERA_PADRE[this.fase];
        const opciones = this.cajasQueSePuedenAmenazar();
        if (opciones.length > 0) {
          this.pulso = { caja: mezclar(opciones)[0], quedan: SEGUNDOS_PULSO };
          eventos.push({ tipo: 'pulso' });
        }
      }
    }

    return eventos;
  }

  get carga() {
    return {
      derecha: 1 - this.esperaDerecha / this.duracionDerecha,
      izquierda: 1 - this.esperaIzquierda / this.duracionIzquierda,
      padre: this.pulso ? 1 : 1 - this.esperaPadre / ESPERA_PADRE[this.fase],
    };
  }
}
