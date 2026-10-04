// Filas, columnas y cajas de un tablero 9x9 normal (índice = fila * 9 +
// columna). Para formas más grandes, ver lienzo.js.

export const fila = (indice) => Math.floor(indice / 9);
export const columna = (indice) => indice % 9;
export const indicesDeFila = (f) => Array.from({ length: 9 }, (_, c) => f * 9 + c);
export const indicesDeColumna = (c) => Array.from({ length: 9 }, (_, f) => f * 9 + c);

// Las 9 cajas de 3x3, de izquierda a derecha y de arriba abajo.
export const CAJAS = Array.from({ length: 9 }, (_, numero) => {
  const filaInicio = Math.floor(numero / 3) * 3;
  const columnaInicio = (numero % 3) * 3;
  return Array.from({ length: 9 }, (_, i) => (filaInicio + Math.floor(i / 3)) * 9 + columnaInicio + (i % 3));
});

export function cajaDe(indice) {
  return CAJAS.find((caja) => caja.includes(indice));
}
