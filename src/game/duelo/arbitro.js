// El árbitro de un duelo: lleva quién se anotó cada casilla y decide
// cuando los dos piden la misma. Vive solo en el teléfono anfitrión; el
// invitado recibe sus decisiones (ver sesion.js).
//
// La regla es simple: una casilla es de quien primero la pide con el
// número correcto. Los pedidos se atienden en el orden en que llegan.

export class Arbitro {
  // tableroInicial y solucion: tableros 9x9 (ver sudoku/tablero.js).
  constructor({ tableroInicial, solucion }) {
    this.solucion = [...solucion];
    this.duenos = tableroInicial.map(() => null); // 'anfitrion' | 'invitado' | null
    this.casillasALlenar = tableroInicial.filter((valor) => valor === 0).length;
    this.vacias = new Set(tableroInicial.flatMap((valor, indice) => (valor === 0 ? [indice] : [])));
  }

  // `quien` pide la casilla `indice` con `valor`. Devuelve true si se la
  // anota; false si ya era de alguien, no estaba vacía al empezar o el
  // número no es el correcto.
  reclamar(quien, indice, valor) {
    if (!this.vacias.has(indice) || this.duenos[indice] !== null) return false;
    if (valor !== this.solucion[indice]) return false;
    this.duenos[indice] = quien;
    return true;
  }

  get puntos() {
    return {
      anfitrion: this.duenos.filter((dueno) => dueno === 'anfitrion').length,
      invitado: this.duenos.filter((dueno) => dueno === 'invitado').length,
    };
  }

  get completo() {
    const { anfitrion, invitado } = this.puntos;
    return anfitrion + invitado === this.casillasALlenar;
  }
}
