// Babel, la torre de los idiomas: un sudoku normal (de la dificultad que
// elija el jugador) en el que los números 1-9 se ven como símbolos.
//
//  - Pasiva "&%?#": cada dígito se ve como un símbolo al azar, y los
//    botones del teclado están desordenados. El teclado físico no escribe
//    números (si no, el desafío desaparece).
//  - Pasiva "La lengua evoluciona": cada vez que completas una caja de
//    3x3, todos los símbolos cambian y el teclado se vuelve a desordenar.
//  - Uber, "Torre de Babel": hay 3 alfabetos a la vez y cada caja usa uno
//    (se ve por su color). El teclado tiene 3 filas, una por alfabeto; la
//    misma columna es el mismo número en las tres.
//
// Aquí solo están las reglas; la pantalla está en screens/jefes/babel.js.

import { mezclar } from '../sudoku/azar.js';
import { DIGITOS, celdasIncorrectas } from '../sudoku/tablero.js';
import { PartidaDeJefe } from './partida-de-jefe.js';
import { CAJAS, cajaDe } from '../sudoku/geometria-9x9.js';

// Símbolos que no se parecen a los dígitos ni entre sí (ojo: ∆ y Δ son
// distintos para la computadora pero idénticos a la vista, así que solo
// va uno). Hay más de los que se usan a la vez para que cada "evolución"
// pueda traer un juego distinto.
const SIMBOLOS = [
  'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'λ', 'μ', 'ξ', 'π', 'ρ', 'σ', 'τ',
  'φ', 'χ', 'ψ', 'ω', 'Ω', 'Φ', 'Ψ', 'Ξ', 'Θ', 'Λ', 'Γ', 'Δ', 'Σ', '∞', '♠',
  '◆', '★', '☾', '☼', '✦', '❖',
];

// `cantidad` alfabetos: cada uno es un Map dígito -> símbolo, sin repetir
// símbolos entre ellos.
function crearAlfabetos(cantidad) {
  const simbolos = mezclar(SIMBOLOS);
  return Array.from({ length: cantidad }, (_, a) =>
    new Map(DIGITOS.map((digito, i) => [digito, simbolos[a * 9 + i]])));
}

export class PeleaBabel extends PartidaDeJefe {
  constructor({ tableroInicial, solucion, dificultad, uber = false }) {
    super({ dificultad, tableroInicial, solucion, permitirNotas: !uber });
    this.uber = uber;
    this.evoluciones = 0;
    // Las cajas que ya vienen completas de fábrica no hacen evolucionar.
    this.cajasCompletas = new Set(CAJAS.filter((caja) => this.cajaResuelta(caja)));
    this.inventarLengua();
  }

  // Los errores se ven al instante, como en el sudoku fácil.
  actualizarErroresVisibles() {
    this.erroresVisibles = celdasIncorrectas(this.tablero, this.solucion, this.lienzo);
    this.erroresRevisados = true;
  }

  cajaResuelta(caja) {
    return caja.every((indice) => this.tablero[indice] === this.solucion[indice]);
  }

  // Símbolos nuevos, teclado desordenado y (uber) alfabeto de cada caja.
  inventarLengua() {
    this.alfabetos = crearAlfabetos(this.uber ? 3 : 1);
    this.ordenTeclado = mezclar(DIGITOS);
    this.alfabetoDeCaja = CAJAS.map(() => (this.uber ? Math.floor(Math.random() * 3) : 0));
  }

  // Qué alfabeto usa la celda (siempre 0 en la versión normal).
  alfabetoDe(indice) {
    return this.alfabetoDeCaja[CAJAS.indexOf(cajaDe(indice))];
  }

  simboloDe(indice, digito) {
    return this.alfabetos[this.alfabetoDe(indice)].get(digito);
  }

  // Si este número completó una caja por primera vez, la lengua evoluciona.
  colocar(indice, valor) {
    if (!super.colocar(indice, valor)) return false;
    const caja = cajaDe(indice);
    if (!this.cajasCompletas.has(caja) && this.cajaResuelta(caja)) {
      this.cajasCompletas.add(caja);
      if (!this.resuelta) {
        this.inventarLengua();
        this.evoluciones++;
      }
    }
    return true;
  }

  // Filas del teclado: una por alfabeto, columnas en el orden desordenado.
  filasDelTeclado() {
    return this.alfabetos.map((alfabeto, numero) =>
      this.ordenTeclado.map((digito) => ({ digito, texto: alfabeto.get(digito), alfabeto: numero })));
  }
}
