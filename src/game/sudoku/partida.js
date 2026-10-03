// Estado de una partida de sudoku 9x9, sin nada de pantalla: qué celdas
// son fijas, qué escribió el jugador, sus notas y qué errores se le
// muestran según la política de la dificultad. La pantalla (screens/sudoku.js)
// solo lee este estado y lo dibuja.

import { celdasIncorrectas, estaCompleto, vecesDelDigito } from './tablero.js';

export class PartidaSudoku {
  // tableroInicial y solucion son arreglos de 81 números (ver tablero.js).
  // tableroActual, segundos y errores permiten retomar una partida en pausa.
  constructor({ dificultad, politicaErrores, tableroInicial, solucion, tableroActual, segundos = 0, errores = 0 }) {
    this.dificultad = dificultad;
    this.politicaErrores = politicaErrores;
    this.tableroInicial = [...tableroInicial];
    this.solucion = [...solucion];
    this.tablero = [...(tableroActual ?? tableroInicial)];
    this.segundos = segundos;

    // Candidatos anotados a lápiz en cada celda (conjuntos de dígitos).
    // Nunca cuentan como jugada ni generan errores.
    this.notas = Array.from({ length: this.tablero.length }, () => new Set());

    // Lo que el tablero muestra en rojo ahora mismo. Según la política
    // puede estar vacío aunque haya errores reales (todavía no tocaba
    // revisar). `erroresRevisados` dice si refleja de verdad el tablero.
    this.erroresVisibles = new Set();
    this.erroresRevisados = false;

    // Cuántos errores cometió el jugador en toda la partida. Nunca baja:
    // corregir un número no borra el error que ya se cometió. Un error se
    // cuenta en el momento en que se le muestra (al escribirlo, al
    // Comprobar o al llenar el tablero, según la política), y una sola
    // vez: `yaContadas` guarda las celdas cuyo número equivocado actual
    // ya sumó. Si la celda cambia, sale de ahí y su próximo error vuelve
    // a contar.
    this.errores = errores;
    this.yaContadas = new Set();

    this.actualizarErroresVisibles();
  }

  esFija(indice) {
    return this.tableroInicial[indice] !== 0;
  }

  get resuelta() {
    return estaCompleto(this.tablero) && celdasIncorrectas(this.tablero, this.solucion).size === 0;
  }

  get cantidadPistas() {
    return this.tableroInicial.filter((valor) => valor !== 0).length;
  }

  // ¿Ya están puestas las 9 apariciones de este dígito?
  digitoCompleto(digito) {
    return vecesDelDigito(this.tablero, digito) >= 9;
  }

  /* ---------- Jugadas ---------- */

  // Las jugadas devuelven true si cambiaron algo (para saber si redibujar).

  colocar(indice, valor) {
    if (this.resuelta || this.esFija(indice)) return false;
    this.tablero[indice] = valor;
    this.yaContadas.delete(indice);
    this.notas[indice].clear(); // la celda ya tiene un número de verdad
    this.actualizarErroresVisibles();
    return true;
  }

  borrar(indice) {
    if (this.resuelta || this.esFija(indice)) return false;
    if (this.tablero[indice] === 0) {
      this.notas[indice].clear();
    } else {
      this.tablero[indice] = 0;
      this.yaContadas.delete(indice);
      this.actualizarErroresVisibles();
    }
    return true;
  }

  // Solo se anota sobre celdas vacías: si ya tienen un número, las notas
  // no se verían de todas formas.
  alternarNota(indice, digito) {
    if (this.resuelta || this.esFija(indice) || this.tablero[indice] !== 0) return false;
    const notas = this.notas[indice];
    if (notas.has(digito)) notas.delete(digito);
    else notas.add(digito);
    return true;
  }

  /* ---------- Errores ---------- */

  // Muestra los errores actuales y suma al contador los que se ven por
  // primera vez. La usa el botón "Comprobar" y, según la política, cada
  // jugada (ver actualizarErroresVisibles).
  comprobar() {
    this.erroresVisibles = celdasIncorrectas(this.tablero, this.solucion);
    this.erroresRevisados = true;

    for (const indice of this.erroresVisibles) {
      if (!this.yaContadas.has(indice)) {
        this.yaContadas.add(indice);
        this.errores++;
      }
    }
  }

  // Qué errores se ven tras cada jugada, según la política:
  //  - instantaneo: siempre al día.
  //  - boton: se ocultan con cada jugada hasta volver a Comprobar.
  //  - final: ocultos hasta que el tablero se llena; ahí se revisa solo.
  actualizarErroresVisibles() {
    const revisarAhora = this.politicaErrores === 'instantaneo'
      || (this.politicaErrores === 'final' && estaCompleto(this.tablero));

    if (revisarAhora) {
      this.comprobar();
    } else {
      this.erroresVisibles = new Set();
      this.erroresRevisados = false;
    }
  }
}
