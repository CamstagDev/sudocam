// La forma de un tablero: una o varias grillas de 9x9 sobre un "lienzo"
// rectangular de celdas.
//
// Un sudoku normal es un lienzo de 9x9 con una sola grilla. Un multi
// sudoku pone varias grillas que se solapan en una caja de 3x3 (como el
// Samurai Sudoku), sobre un lienzo más grande con huecos: las celdas que
// no caen en ninguna grilla quedan inactivas.
//
// Los tableros siguen siendo arreglos planos (índice = fila * ancho +
// columna); las celdas inactivas valen siempre 0 y nadie las toca.
//
//   const lienzo = crearLienzo([{ fila: 0, columna: 0 }, { fila: 6, columna: 6 }]);
//   lienzo.celdas        índices de las celdas activas, en orden
//   lienzo.vecinos[i]    celdas que no pueden repetir el número de i
//                        (su fila, columna y caja en cada grilla a la que pertenece)
//   lienzo.ubicaciones[i] en qué grilla(s) está i y en qué fila/columna local

export const TAMANO_GRILLA = 9;
export const TAMANO_CAJA = 3;

// `origenes`: la esquina superior izquierda de cada grilla de 9x9.
export function crearLienzo(origenes) {
  const ancho = Math.max(...origenes.map((o) => o.columna)) + TAMANO_GRILLA;
  const alto = Math.max(...origenes.map((o) => o.fila)) + TAMANO_GRILLA;
  const totalCeldas = ancho * alto;
  const indiceDe = (fila, columna) => fila * ancho + columna;

  const ubicaciones = Array.from({ length: totalCeldas }, () => []);
  const vecinos = Array.from({ length: totalCeldas }, () => new Set());

  // Filas, columnas y cajas de todas las grillas: dentro de cada grupo,
  // ningún número se repite.
  const grupos = [];

  origenes.forEach((origen, grilla) => {
    const celdaDe = (fila, columna) => indiceDe(origen.fila + fila, origen.columna + columna);

    for (let fila = 0; fila < TAMANO_GRILLA; fila++) {
      for (let columna = 0; columna < TAMANO_GRILLA; columna++) {
        ubicaciones[celdaDe(fila, columna)].push({ grilla, fila, columna });
      }
    }

    for (let n = 0; n < TAMANO_GRILLA; n++) {
      grupos.push(Array.from({ length: TAMANO_GRILLA }, (_, i) => celdaDe(n, i))); // fila n
      grupos.push(Array.from({ length: TAMANO_GRILLA }, (_, i) => celdaDe(i, n))); // columna n
    }
    for (let filaCaja = 0; filaCaja < TAMANO_GRILLA; filaCaja += TAMANO_CAJA) {
      for (let columnaCaja = 0; columnaCaja < TAMANO_GRILLA; columnaCaja += TAMANO_CAJA) {
        const caja = [];
        for (let f = 0; f < TAMANO_CAJA; f++) {
          for (let c = 0; c < TAMANO_CAJA; c++) caja.push(celdaDe(filaCaja + f, columnaCaja + c));
        }
        grupos.push(caja);
      }
    }
  });

  for (const grupo of grupos) {
    for (const a of grupo) {
      for (const b of grupo) {
        if (a !== b) vecinos[a].add(b);
      }
    }
  }

  return {
    ancho,
    alto,
    totalCeldas,
    cantidadGrillas: origenes.length,
    celdas: ubicaciones.flatMap((lugares, indice) => (lugares.length > 0 ? [indice] : [])),
    vecinos: vecinos.map((conjunto) => [...conjunto]),
    ubicaciones,
    grupos,
  };
}

export const LIENZO_9X9 = crearLienzo([{ fila: 0, columna: 0 }]);

// Siguiente celda activa al moverse con las flechas. En un multi sudoku
// salta los huecos; si no hay más celdas en esa dirección, se queda donde
// está.
const DIRECCIONES = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

export function celdaEnDireccion(lienzo, indice, tecla) {
  const [pasoFila, pasoColumna] = DIRECCIONES[tecla];
  let fila = Math.floor(indice / lienzo.ancho);
  let columna = indice % lienzo.ancho;

  for (;;) {
    fila += pasoFila;
    columna += pasoColumna;
    if (fila < 0 || fila >= lienzo.alto || columna < 0 || columna >= lienzo.ancho) return indice;
    const siguiente = fila * lienzo.ancho + columna;
    if (lienzo.ubicaciones[siguiente].length > 0) return siguiente;
  }
}
