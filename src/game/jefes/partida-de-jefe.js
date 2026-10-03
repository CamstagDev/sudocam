// Base de toda pelea contra un jefe: una PartidaSudoku con las reglas que
// comparten los jefes.
//  - En rojo se ven solo los números repetidos (como en papel), no los
//    que no coinciden con la solución: el jefe no te regala esa ayuda.
//  - Cada número equivocado cuenta como error en el momento en que se
//    escribe, aunque no se vea (para la "mejor marca" y los logros).
//  - Se anota si el jugador usó notas en algún momento.
//  - `permitirNotas: false` (los uber) las desactiva por completo.
//
// Cada jefe extiende esta clase con su propia mecánica (ver uriel.js).

import { PartidaSudoku } from '../sudoku/partida.js';
import { celdasRepetidas } from '../sudoku/tablero.js';

export class PartidaDeJefe extends PartidaSudoku {
  constructor({ permitirNotas = true, ...opciones }) {
    super({ ...opciones, politicaErrores: 'jefe' });
    this.permitirNotas = permitirNotas;
    this.usoNotas = false;
  }

  colocar(indice, valor) {
    if (!super.colocar(indice, valor)) return false;
    if (valor !== this.solucion[indice]) this.errores++;
    return true;
  }

  alternarNota(indice, digito) {
    if (!this.permitirNotas) return false;
    const cambio = super.alternarNota(indice, digito);
    if (cambio) this.usoNotas = true;
    return cambio;
  }

  actualizarErroresVisibles() {
    this.erroresVisibles = celdasRepetidas(this.tablero, this.lienzo);
    this.erroresRevisados = true;
  }
}
