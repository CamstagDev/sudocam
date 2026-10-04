// Hecate, la jefa de las ilusiones: hay que resolver un sudoku medio
// antes de que se acabe el reloj (15 minutos) mientras ella engaña.
//
//  - Visiones ilusorias (cada 15 s): una celda vacía aparece con un
//    número falso durante 10 s, dibujado como si fuera una pista. En la
//    versión normal parpadea lento; en la uber no se distingue.
//  - Aullido paralizante (pasiva): elige un dígito que todavía falte y
//    pasa 20 s "convirtiéndolo en piedra"; después queda inutilizable un
//    rato (5 s, o 10 s en fase 2).
//  - Pesar Castigador (pasiva): cada error resta 1 minuto al reloj.
//  - Maldición de pesadilla (cada 10 s, solo en fase 2): disfraza uno de
//    tus números o notas con otro valor durante 10 s.
// La fase 2 empieza al tener el 80% del tablero lleno o al quedar 1
// minuto, lo que pase primero.
//
// Todo el tiempo avanza con avanzarUnSegundo(), que devuelve lo que pasó
// para que la pantalla lo anuncie. Aquí no hay pantalla ni temporizadores.

import { mezclar } from '../sudoku/azar.js';
import { DIGITOS } from '../sudoku/tablero.js';
import { PartidaDeJefe } from './partida-de-jefe.js';

export const SEGUNDOS_TOTALES = 15 * 60;
export const SEGUNDOS_PENALIZACION = 60;
export const SEGUNDOS_VISION = 15;
export const SEGUNDOS_MALDICION = 10;
export const SEGUNDOS_AULLIDO = 20;
const DURACION_ILUSION = 10;
const DURACION_MALDICION = 10;
const DURACION_PETRIFICADO = { 1: 5, 2: 10 };
const UMBRAL_FASE_2 = 0.8;
const SEGUNDOS_FASE_2_POR_TIEMPO = 60;

const alAzar = (lista) => mezclar(lista)[0];
const otroDigito = (evitar) => alAzar(DIGITOS.filter((digito) => digito !== evitar));

export class PeleaHecate extends PartidaDeJefe {
  constructor({ tableroInicial, solucion, uber = false }) {
    super({ dificultad: 'medio', tableroInicial, solucion, permitirNotas: !uber });
    this.uber = uber;
    this.restantes = SEGUNDOS_TOTALES;
    this.casillasALlenar = tableroInicial.filter((valor) => valor === 0).length;
    this.alcanzoFase2 = false;

    this.esperaVision = SEGUNDOS_VISION;
    this.esperaMaldicion = SEGUNDOS_MALDICION;
    this.ilusion = null; // { indice, valor, quedan }
    this.maldicion = null; // { indice, sobre: 'valor' | 'nota', real, falso, quedan }

    this.aullido = null; // { digito, quedan }: se está convirtiendo en piedra
    this.petrificado = null; // { digito, quedan }: ya no se puede usar
    this.elegirObjetivoAullido();
  }

  get derrotada() {
    return this.restantes <= 0;
  }

  // 80% de las casillas vacías llenas, o 1 minuto en el reloj. No vuelve atrás.
  get fase() {
    if (this.alcanzoFase2) return 2;
    const vacias = this.tablero.filter((valor) => valor === 0).length;
    const llenas = (this.casillasALlenar - vacias) / this.casillasALlenar;
    if (llenas >= UMBRAL_FASE_2 || this.restantes <= SEGUNDOS_FASE_2_POR_TIEMPO) this.alcanzoFase2 = true;
    return this.alcanzoFase2 ? 2 : 1;
  }

  /* ---------- Jugadas del jugador ---------- */

  colocar(indice, valor) {
    if (valor === this.petrificado?.digito) return false;
    const habiaErrores = this.errores;
    if (!super.colocar(indice, valor)) return false;
    // Pesar Castigador: cada error cuesta un minuto.
    if (this.errores > habiaErrores) this.restantes = Math.max(0, this.restantes - SEGUNDOS_PENALIZACION);
    this.refrescarObjetivoAullido();
    return true;
  }

  alternarNota(indice, digito) {
    if (digito === this.petrificado?.digito) return false;
    return super.alternarNota(indice, digito);
  }

  borrar(indice) {
    const cambio = super.borrar(indice);
    if (cambio) this.refrescarObjetivoAullido();
    return cambio;
  }

  /* ---------- Aullido paralizante ---------- */

  digitosQueFaltan() {
    return DIGITOS.filter((digito) => !this.digitoCompleto(digito));
  }

  elegirObjetivoAullido() {
    const opciones = this.digitosQueFaltan();
    this.aullido = opciones.length > 0 ? { digito: alAzar(opciones), quedan: SEGUNDOS_AULLIDO } : null;
  }

  // Si el dígito amenazado ya se completó, no tiene sentido seguir: elige
  // otro. Si estaba dormida por falta de candidatos, intenta de nuevo.
  refrescarObjetivoAullido() {
    if (this.petrificado) return;
    if (!this.aullido || this.digitoCompleto(this.aullido.digito)) this.elegirObjetivoAullido();
  }

  /* ---------- Engaños ---------- */

  lanzarVision() {
    const vacias = this.lienzo.celdas.filter((indice) => this.tablero[indice] === 0);
    if (vacias.length === 0) return null;
    this.ilusion = { indice: alAzar(vacias), valor: alAzar(DIGITOS), quedan: DURACION_ILUSION };
    return this.ilusion;
  }

  lanzarMaldicion() {
    const objetivos = this.lienzo.celdas.flatMap((indice) => {
      if (this.esFija(indice)) return [];
      if (this.tablero[indice] !== 0) return [{ indice, sobre: 'valor', real: this.tablero[indice] }];
      if (this.notas[indice].size > 0) return [{ indice, sobre: 'nota', real: alAzar([...this.notas[indice]]) }];
      return [];
    });
    if (objetivos.length === 0) return null;
    const elegido = alAzar(objetivos);
    this.maldicion = { ...elegido, falso: otroDigito(elegido.real), quedan: DURACION_MALDICION };
    return this.maldicion;
  }

  /* ---------- El reloj ---------- */

  // Avanza un segundo. Devuelve los eventos que pasaron, en orden:
  //   { tipo: 'vision' | 'maldicion' | 'petrifica' | 'libera' | 'derrota', ... }
  // (el paso a fase 2 se ve en `fase`: también puede llegar por una jugada)
  avanzarUnSegundo() {
    const eventos = [];
    this.restantes = Math.max(0, this.restantes - 1);

    // Duración de lo que ya está activo.
    if (this.ilusion && --this.ilusion.quedan <= 0) this.ilusion = null;
    if (this.maldicion && --this.maldicion.quedan <= 0) this.maldicion = null;
    if (this.petrificado && --this.petrificado.quedan <= 0) {
      eventos.push({ tipo: 'libera', digito: this.petrificado.digito });
      this.petrificado = null;
      this.elegirObjetivoAullido();
    }

    if (--this.esperaVision <= 0) {
      this.esperaVision = SEGUNDOS_VISION;
      const ilusion = this.lanzarVision();
      if (ilusion) eventos.push({ tipo: 'vision', ...ilusion });
    }

    this.refrescarObjetivoAullido();
    if (this.aullido && --this.aullido.quedan <= 0) {
      this.petrificado = { digito: this.aullido.digito, quedan: DURACION_PETRIFICADO[this.fase] };
      this.aullido = null;
      eventos.push({ tipo: 'petrifica', digito: this.petrificado.digito });
    }

    if (this.fase === 2) {
      if (--this.esperaMaldicion <= 0) {
        this.esperaMaldicion = SEGUNDOS_MALDICION;
        const maldicion = this.lanzarMaldicion();
        if (maldicion) eventos.push({ tipo: 'maldicion', ...maldicion });
      }
    }

    if (this.derrotada) eventos.push({ tipo: 'derrota' });
    return eventos;
  }

  // Qué tan cargada está cada habilidad, de 0 a 1 (para los anillos).
  get carga() {
    return {
      vision: 1 - this.esperaVision / SEGUNDOS_VISION,
      maldicion: 1 - this.esperaMaldicion / SEGUNDOS_MALDICION,
      aullido: this.aullido ? 1 - this.aullido.quedan / SEGUNDOS_AULLIDO : 0,
    };
  }

  /* ---------- Lo que ve el jugador ---------- */

  // Lo que hay que mostrar distinto de la realidad:
  //   valores: Map celda -> número falso
  //   fijas: celdas que deben parecer pistas (la ilusión)
  //   notas: Map celda -> Map(nota real -> nota falsa)
  disfraz() {
    const valores = new Map();
    const fijas = new Set();
    const notas = new Map();

    if (this.ilusion && this.tablero[this.ilusion.indice] === 0) {
      valores.set(this.ilusion.indice, this.ilusion.valor);
      fijas.add(this.ilusion.indice);
    }
    const m = this.maldicion;
    if (m?.sobre === 'valor' && this.tablero[m.indice] === m.real) valores.set(m.indice, m.falso);
    if (m?.sobre === 'nota' && this.notas[m.indice].has(m.real)) notas.set(m.indice, new Map([[m.real, m.falso]]));

    return { valores, fijas, notas };
  }
}
