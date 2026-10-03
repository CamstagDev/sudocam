// Un tablero es un arreglo plano de números (0 = celda vacía, 1-9 =
// valor), recorrido por filas: índice = fila * ancho + columna. Su forma
// (cuántas grillas, qué celdas están activas) la describe un lienzo (ver
// lienzo.js); un sudoku normal es un lienzo de 9x9.
//
// Para guardarlo se convierte a texto: un dígito por celda.

export const DIGITOS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function crearTableroVacio(totalCeldas = 81) {
  return new Array(totalCeldas).fill(0);
}

export function estaCompleto(tablero, lienzo) {
  return lienzo.celdas.every((indice) => tablero[indice] !== 0);
}

// Celdas llenas cuyo valor no coincide con la solución. Comparar contra la
// solución (y no solo buscar números repetidos) es lo que permite marcar
// un error desde la primera jugada.
export function celdasIncorrectas(tablero, solucion, lienzo) {
  return new Set(lienzo.celdas.filter((indice) => tablero[indice] !== 0 && tablero[indice] !== solucion[indice]));
}

// Cuántas veces aparece `digito` en el tablero.
export function vecesDelDigito(tablero, digito) {
  return tablero.filter((valor) => valor === digito).length;
}

export function tableroATexto(tablero) {
  return tablero.join('');
}

export function textoATablero(texto) {
  return [...texto].map(Number);
}

// Celdas cuyo número se repite con alguna vecina (misma fila, columna o
// caja). A diferencia de celdasIncorrectas, no mira la solución: es lo que
// el jugador podría ver por sí mismo.
export function celdasRepetidas(tablero, lienzo) {
  return new Set(lienzo.celdas.filter((indice) => {
    const valor = tablero[indice];
    return valor !== 0 && lienzo.vecinos[indice].some((vecina) => tablero[vecina] === valor);
  }));
}
