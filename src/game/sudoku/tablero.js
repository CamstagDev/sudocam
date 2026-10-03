// Funciones puras sobre un tablero de sudoku 9x9.
//
// Un tablero es un arreglo plano de 81 números (0 = celda vacía, 1-9 =
// valor), recorrido por filas: índice = fila * 9 + columna. Para guardarlo
// se convierte a un texto de 81 dígitos con tableroATexto / textoATablero.

export const TAMANO = 9;
export const TAMANO_CAJA = 3;
export const TOTAL_CELDAS = TAMANO * TAMANO;
export const DIGITOS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function crearTableroVacio() {
  return new Array(TOTAL_CELDAS).fill(0);
}

export function filaDe(indice) {
  return Math.floor(indice / TAMANO);
}

export function columnaDe(indice) {
  return indice % TAMANO;
}

export function indiceDe(fila, columna) {
  return fila * TAMANO + columna;
}

/* ---------- Grupos: fila, columna y caja de 3x3 ---------- */

export function indicesDeFila(fila) {
  return Array.from({ length: TAMANO }, (_, columna) => indiceDe(fila, columna));
}

export function indicesDeColumna(columna) {
  return Array.from({ length: TAMANO }, (_, fila) => indiceDe(fila, columna));
}

// Los 9 índices de la caja de 3x3 que contiene a `indice`.
export function indicesDeCaja(indice) {
  const filaInicio = Math.floor(filaDe(indice) / TAMANO_CAJA) * TAMANO_CAJA;
  const columnaInicio = Math.floor(columnaDe(indice) / TAMANO_CAJA) * TAMANO_CAJA;
  const indices = [];
  for (let fila = filaInicio; fila < filaInicio + TAMANO_CAJA; fila++) {
    for (let columna = columnaInicio; columna < columnaInicio + TAMANO_CAJA; columna++) {
      indices.push(indiceDe(fila, columna));
    }
  }
  return indices;
}

export function mismaCaja(indiceA, indiceB) {
  return Math.floor(filaDe(indiceA) / TAMANO_CAJA) === Math.floor(filaDe(indiceB) / TAMANO_CAJA)
    && Math.floor(columnaDe(indiceA) / TAMANO_CAJA) === Math.floor(columnaDe(indiceB) / TAMANO_CAJA);
}

// ¿Comparten fila, columna o caja? Una celda no cuenta como relacionada
// consigo misma.
export function estanRelacionadas(indiceA, indiceB) {
  if (indiceA === indiceB) return false;
  return filaDe(indiceA) === filaDe(indiceB)
    || columnaDe(indiceA) === columnaDe(indiceB)
    || mismaCaja(indiceA, indiceB);
}

/* ---------- Reglas ---------- */

// ¿Se puede poner `valor` en `indice` sin repetirlo en su fila, columna o
// caja? No mira la propia celda.
//
// Va con bucles simples a propósito: el generador la llama cientos de
// miles de veces, y armar arreglos en cada llamada lo hacía unas 50 veces
// más lento.
export function sePuedeColocar(tablero, indice, valor) {
  const fila = filaDe(indice);
  const columna = columnaDe(indice);

  for (let i = 0; i < TAMANO; i++) {
    const enFila = indiceDe(fila, i);
    const enColumna = indiceDe(i, columna);
    if (enFila !== indice && tablero[enFila] === valor) return false;
    if (enColumna !== indice && tablero[enColumna] === valor) return false;
  }

  const filaCaja = fila - (fila % TAMANO_CAJA);
  const columnaCaja = columna - (columna % TAMANO_CAJA);
  for (let f = filaCaja; f < filaCaja + TAMANO_CAJA; f++) {
    for (let c = columnaCaja; c < columnaCaja + TAMANO_CAJA; c++) {
      const enCaja = indiceDe(f, c);
      if (enCaja !== indice && tablero[enCaja] === valor) return false;
    }
  }

  return true;
}

export function estaCompleto(tablero) {
  return tablero.every((valor) => valor !== 0);
}

// Índices de las celdas llenas cuyo valor no coincide con la solución.
// Comparar contra la solución (y no solo buscar números repetidos) es lo
// que permite marcar un error desde la primera jugada.
export function celdasIncorrectas(tablero, solucion) {
  const incorrectas = new Set();
  tablero.forEach((valor, indice) => {
    if (valor !== 0 && valor !== solucion[indice]) incorrectas.add(indice);
  });
  return incorrectas;
}

// Cuántas veces aparece `digito` en el tablero.
export function vecesDelDigito(tablero, digito) {
  return tablero.filter((valor) => valor === digito).length;
}

/* ---------- Conversión a texto (para guardar) ---------- */

export function tableroATexto(tablero) {
  return tablero.join('');
}

export function textoATablero(texto) {
  return [...texto].map(Number);
}
