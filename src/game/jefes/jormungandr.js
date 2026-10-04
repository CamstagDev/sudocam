// Jörmungandr, la serpiente: resuelve un sudoku difícil mientras ella se
// va comiendo el tablero.
//
//  - Hambre (cada 60 s, fase 1): devora un número que hayas puesto (2 en
//    la uber); la celda vuelve a quedar vacía.
//  - Ouroboros (pasiva): cuenta los números en el vientre. Sube con cada
//    bocado y baja cuando llenas una celda vacía (solo la primera vez por
//    celda, para que borrar y reescribir no sirva de truco).
//  - Glotonería (fase 2, con 10 o más en el vientre): en vez de tus
//    números devora una pista original (3 en la uber), que deja de estar
//    fija; si ya no quedan pistas, devora 2 números tuyos (3 en la uber).
//    Como el vientre sube y baja, la pelea entra y sale de la fase 2.
//  - Secreto: con una celda con número elegida, tocar a Ouroboros se la
//    da de comer (una pista original cuenta doble).
//
// Aquí solo están las reglas; la pantalla está en screens/jefes/jormungandr.js.

import { mezclar } from '../sudoku/azar.js';
import { celdasIncorrectas } from '../sudoku/tablero.js';
import { PartidaDeJefe } from './partida-de-jefe.js';

export const SEGUNDOS_HAMBRE = 60;
export const UMBRAL_FASE_2 = 10;

const BOCADOS = {
  normal: { hambre: 1, glotoneria: 1, glotoneriaSinPistas: 2 },
  uber: { hambre: 2, glotoneria: 3, glotoneriaSinPistas: 3 },
};

export class PeleaJormungandr extends PartidaDeJefe {
  constructor({ tableroInicial, solucion, uber = false }) {
    super({ dificultad: 'dificil', tableroInicial, solucion, permitirNotas: !uber });
    this.uber = uber;
    this.bocados = uber ? BOCADOS.uber : BOCADOS.normal;
    this.vientre = 0;
    this.aliviadas = new Set(); // celdas que ya restaron del vientre
    this.alcanzoFase2 = false; // para el logro "Hambruna"
    this.esperaComer = SEGUNDOS_HAMBRE;
  }

  // Contra Jörmungandr los errores se ven al instante (en rojo todo número
  // que no coincide con la solución), como en el sudoku fácil.
  actualizarErroresVisibles() {
    this.erroresVisibles = celdasIncorrectas(this.tablero, this.solucion, this.lienzo);
    this.erroresRevisados = true;
  }

  get fase() {
    return this.vientre >= UMBRAL_FASE_2 ? 2 : 1;
  }

  cambiarVientre(cantidad) {
    this.vientre = Math.max(0, this.vientre + cantidad);
    if (this.fase === 2) this.alcanzoFase2 = true;
  }

  /* ---------- Jugadas del jugador ---------- */

  colocar(indice, valor) {
    if (!super.colocar(indice, valor)) return false;
    if (!this.aliviadas.has(indice)) {
      this.aliviadas.add(indice);
      this.cambiarVientre(-1);
    }
    return true;
  }

  // Borrar lo que acabas de poner devuelve el alivio: no sale gratis.
  borrar(indice) {
    const teniaNumero = this.tablero[indice] !== 0;
    if (!super.borrar(indice)) return false;
    if (teniaNumero && this.aliviadas.delete(indice)) this.cambiarVientre(1);
    return true;
  }

  /* ---------- Bocados ---------- */

  numerosDelJugador() {
    return this.lienzo.celdas.filter((indice) => !this.esFija(indice) && this.tablero[indice] !== 0);
  }

  pistasQueQuedan() {
    return this.lienzo.celdas.filter((indice) => this.esFija(indice));
  }

  // La celda queda vacía; una pista deja de estar fija para siempre.
  devorar(indice) {
    const bocado = { indice, valor: this.tablero[indice], pista: this.esFija(indice) };
    this.tablero[indice] = 0;
    this.tableroInicial[indice] = 0;
    this.notas[indice].clear();
    this.aliviadas.delete(indice);
    this.cambiarVientre(1);
    this.actualizarErroresVisibles();
    return bocado;
  }

  // Hambre o Glotonería según la fase. Devuelve { tecnica, bocados }.
  comer() {
    let tecnica;
    let objetivos;
    if (this.fase === 1) {
      tecnica = 'hambre';
      objetivos = mezclar(this.numerosDelJugador()).slice(0, this.bocados.hambre);
    } else if (this.pistasQueQuedan().length > 0) {
      tecnica = 'glotoneria';
      objetivos = mezclar(this.pistasQueQuedan()).slice(0, this.bocados.glotoneria);
    } else {
      tecnica = 'glotoneria';
      objetivos = mezclar(this.numerosDelJugador()).slice(0, this.bocados.glotoneriaSinPistas);
    }
    return { tecnica, bocados: objetivos.map((indice) => this.devorar(indice)) };
  }

  // Secreto: darle de comer la celda elegida. Una pista cuenta doble.
  alimentar(indice) {
    if (indice === null || this.tablero[indice] === 0 || this.resuelta) return null;
    const bocado = this.devorar(indice);
    if (bocado.pista) this.cambiarVientre(1);
    return bocado;
  }

  /* ---------- El reloj ---------- */

  // Devuelve lo que comió si le tocaba comer, o null.
  avanzarUnSegundo() {
    if (--this.esperaComer > 0) return null;
    this.esperaComer = SEGUNDOS_HAMBRE;
    return this.comer();
  }

  get carga() {
    return {
      comer: 1 - this.esperaComer / SEGUNDOS_HAMBRE,
      vientre: Math.min(1, this.vientre / UMBRAL_FASE_2),
    };
  }
}
