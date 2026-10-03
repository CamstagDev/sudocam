// Uriel, el primer jefe: el jugador y Uriel compiten por llenar las
// casillas vacías; gana quien se anote más.
//
// Uriel juega con dos búsquedas, cada una con su propio tiempo de espera:
//  - Búsqueda fácil (cada 15 s, siempre): en una caja de 3x3 al azar busca
//    una fila, columna o caja a la que solo le falte un número.
//  - Búsqueda por descarte (cada 30 s, desde la fase 2): un número que
//    solo cabe en un hueco de la caja, cruzando filas y columnas.
//  - Pasiva "Purga del Débil": cada error del jugador hace que Uriel
//    revise al instante la caja donde ocurrió.
// La fase 2 empieza cuando se llena la mitad de las casillas que
// empezaron vacías (o con el truco secreto del retrato).
//
// Aquí solo están las reglas (sin pantalla); la pelea en sí, con
// cronómetros y animaciones, está en screens/jefes/uriel.js.

import { mezclar } from '../sudoku/azar.js';
import { PartidaDeJefe } from './partida-de-jefe.js';

export const SEGUNDOS_BUSQUEDA_FACIL = 15;
export const SEGUNDOS_BUSQUEDA_DESCARTE = 30;
const UMBRAL_FASE_2 = 0.5;

/* ---------- Geometría del 9x9 ---------- */

const fila = (indice) => Math.floor(indice / 9);
const columna = (indice) => indice % 9;
const indicesDeFila = (f) => Array.from({ length: 9 }, (_, c) => f * 9 + c);
const indicesDeColumna = (c) => Array.from({ length: 9 }, (_, f) => f * 9 + c);

export const CAJAS = Array.from({ length: 9 }, (_, numero) => {
  const filaInicio = Math.floor(numero / 3) * 3;
  const columnaInicio = (numero % 3) * 3;
  return Array.from({ length: 9 }, (_, i) => (filaInicio + Math.floor(i / 3)) * 9 + columnaInicio + (i % 3));
});

export function cajaDe(indice) {
  return CAJAS.find((caja) => caja.includes(indice));
}

/* ---------- Lo que Uriel "ve" ---------- */

// Uriel no se fía de los números del jugador que están mal: una celda solo
// le sirve de pista si coincide con la solución. Las demás (vacías o
// equivocadas) son "pendientes": puede completarlas o corregirlas.
function estaResuelta(tablero, solucion, indice) {
  return tablero[indice] !== 0 && tablero[indice] === solucion[indice];
}

function pendientes(tablero, solucion, indices) {
  return indices.filter((indice) => !estaResuelta(tablero, solucion, indice));
}

// Una caja al azar que todavía tenga algo pendiente (o null). Con
// `evitar` no repite cajas ya elegidas en la misma tanda (Uber Uriel).
export function elegirCajaAlAzar(tablero, solucion, evitar = []) {
  const opciones = CAJAS.filter((caja) => !evitar.includes(caja) && pendientes(tablero, solucion, caja).length > 0);
  return opciones.length > 0 ? mezclar(opciones)[0] : null;
}

/* ---------- Las dos búsquedas ---------- */

// Fácil: a una fila, columna o a la caja entera solo le falta este número.
export function buscarJugadaFacil(tablero, solucion, caja) {
  for (const indice of pendientes(tablero, solucion, caja)) {
    const lineas = [indicesDeFila(fila(indice)), indicesDeColumna(columna(indice)), caja];
    if (lineas.some((linea) => pendientes(tablero, solucion, linea).length === 1)) {
      return { indice, valor: solucion[indice] };
    }
  }
  return null;
}

// Descarte: un número que la caja no tiene y que, por sus filas y
// columnas, solo cabe en una de las celdas pendientes.
export function buscarJugadaPorDescarte(tablero, solucion, caja) {
  const libres = pendientes(tablero, solucion, caja);
  const yaEnLaCaja = new Set(caja.filter((i) => estaResuelta(tablero, solucion, i)).map((i) => tablero[i]));
  const estaEn = (indices, digito) => indices.some((i) => estaResuelta(tablero, solucion, i) && tablero[i] === digito);

  for (let digito = 1; digito <= 9; digito++) {
    if (yaEnLaCaja.has(digito)) continue;
    const huecos = libres.filter((indice) =>
      !estaEn(indicesDeFila(fila(indice)), digito) && !estaEn(indicesDeColumna(columna(indice)), digito));
    if (huecos.length === 1) return { indice: huecos[0], valor: digito };
  }
  return null;
}

// Las celdas que Uriel recorre al buscar en una caja (para la animación).
export function celdasARevisar(tablero, solucion, caja) {
  return pendientes(tablero, solucion, caja);
}

/* ---------- La pelea ---------- */

export class PeleaUriel extends PartidaDeJefe {
  // `uber`: cada búsqueda periódica apunta a 2 cajas en vez de 1, y no
  // hay notas.
  constructor({ tableroInicial, solucion, uber = false }) {
    super({ dificultad: 'facil', tableroInicial, solucion, permitirNotas: !uber });
    this.uber = uber;
    this.cajasPorBusqueda = uber ? 2 : 1;
    this.casillasALlenar = tableroInicial.filter((valor) => valor === 0).length;

    // Quién se anotó cada casilla: 'jugador' | 'jefe' | null.
    this.duenos = new Array(tableroInicial.length).fill(null);
    this.faseForzada = false; // truco secreto del retrato
    this.alcanzoFase2 = false; // una vez en fase 2, no se vuelve atrás

    this.esperaFacil = SEGUNDOS_BUSQUEDA_FACIL;
    this.esperaDescarte = SEGUNDOS_BUSQUEDA_DESCARTE;
  }

  // Las casillas que ganó Uriel quedan fijas: son sus puntos.
  esFija(indice) {
    return super.esFija(indice) || this.duenos?.[indice] === 'jefe';
  }

  colocar(indice, valor) {
    if (!super.colocar(indice, valor)) return false;
    this.duenos[indice] = valor === this.solucion[indice] ? 'jugador' : null;
    return true;
  }

  borrar(indice) {
    if (!super.borrar(indice)) return false;
    if (this.tablero[indice] === 0) this.duenos[indice] = null;
    return true;
  }

  // Uriel pone un número correcto y se anota la casilla.
  jugadaDelJefe({ indice, valor }) {
    this.tablero[indice] = valor;
    this.duenos[indice] = 'jefe';
    this.notas[indice].clear();
    this.actualizarErroresVisibles();
  }

  get puntos() {
    return {
      jugador: this.duenos.filter((dueno) => dueno === 'jugador').length,
      jefe: this.duenos.filter((dueno) => dueno === 'jefe').length,
    };
  }

  // Fase 2 desde que se llena la mitad de las casillas que empezaron
  // vacías (un número equivocado también cuenta como "llenada"). Aunque
  // después se borren números, Uriel se queda en fase 2.
  get fase() {
    if (this.faseForzada || this.alcanzoFase2) return 2;
    const vacias = this.tablero.filter((valor) => valor === 0).length;
    const llenadas = this.casillasALlenar - vacias;
    if (llenadas / this.casillasALlenar >= UMBRAL_FASE_2) this.alcanzoFase2 = true;
    return this.alcanzoFase2 ? 2 : 1;
  }

  // Búsqueda que usa Uriel ahora: la fácil, o la de descarte desde la fase 2.
  buscarJugada(tipo, caja) {
    return tipo === 'descarte'
      ? buscarJugadaPorDescarte(this.tablero, this.solucion, caja)
      : buscarJugadaFacil(this.tablero, this.solucion, caja);
  }

  // Avanza un segundo los tiempos de espera. Devuelve las búsquedas que
  // tocan ahora: [], ['facil'], ['descarte'] o las dos.
  avanzarUnSegundo() {
    const tocan = [];
    this.esperaFacil--;
    if (this.esperaFacil <= 0) {
      tocan.push('facil');
      this.esperaFacil = SEGUNDOS_BUSQUEDA_FACIL;
    }
    if (this.fase === 2) {
      this.esperaDescarte--;
      if (this.esperaDescarte <= 0) {
        tocan.push('descarte');
        this.esperaDescarte = SEGUNDOS_BUSQUEDA_DESCARTE;
      }
    }
    return tocan;
  }

  // Qué tan cargada está cada búsqueda, de 0 a 1 (para los anillos).
  get carga() {
    return {
      facil: 1 - this.esperaFacil / SEGUNDOS_BUSQUEDA_FACIL,
      descarte: 1 - this.esperaDescarte / SEGUNDOS_BUSQUEDA_DESCARTE,
    };
  }
}
