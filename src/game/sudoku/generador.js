// Generación de sudokus 9x9 con solución única.
//
// 1. Se arma un tablero completo al azar (backtracking probando los
//    dígitos en orden aleatorio).
// 2. Se van vaciando celdas en orden aleatorio, y una celda solo se deja
//    vacía si el puzzle sigue teniendo exactamente una solución.
// 3. Se para al llegar al número de pistas pedido, o en el mínimo posible
//    si la unicidad no deja bajar más.

import { DIGITOS, TOTAL_CELDAS, crearTableroVacio, sePuedeColocar } from './tablero.js';

export function mezclar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Llena las celdas vacías de `tablero` (lo modifica). Devuelve true si
// encontró una forma válida de completarlo.
function completar(tablero) {
  const indiceVacio = tablero.indexOf(0);
  if (indiceVacio === -1) return true;

  for (const valor of mezclar(DIGITOS)) {
    if (sePuedeColocar(tablero, indiceVacio, valor)) {
      tablero[indiceVacio] = valor;
      if (completar(tablero)) return true;
    }
  }

  tablero[indiceVacio] = 0;
  return false;
}

// Cuenta las soluciones de `tablero` sin pasar de `limite`. Para saber si
// es única basta con ver si aparece una segunda: no hace falta contarlas
// todas.
export function contarSoluciones(tablero, limite = 2) {
  const copia = [...tablero];
  let encontradas = 0;

  function buscar() {
    const indiceVacio = copia.indexOf(0);
    if (indiceVacio === -1) {
      encontradas++;
      return;
    }

    for (const valor of DIGITOS) {
      if (encontradas >= limite) return;
      if (sePuedeColocar(copia, indiceVacio, valor)) {
        copia[indiceVacio] = valor;
        buscar();
        copia[indiceVacio] = 0;
      }
    }
  }

  buscar();
  return encontradas;
}

// Tablero 9x9 completo y válido, distinto en cada llamada. Con `fijas`
// (81 posiciones, 0 = libre) arranca respetando esas celdas; lo usarán el
// multi sudoku y Typhon para enganchar grillas que comparten una caja.
export function generarSolucion(fijas = crearTableroVacio()) {
  const tablero = [...fijas];
  if (!completar(tablero)) {
    throw new Error('Esas celdas fijas no permiten completar el tablero');
  }
  return tablero;
}

// Puzzle con `pistas` celdas dadas (o lo más cerca posible). Las celdas de
// `fijas` nunca se vacían.
export function generarPuzzle(pistas, fijas = crearTableroVacio()) {
  const solucion = generarSolucion(fijas);
  const puzzle = [...solucion];

  const todasLasCeldas = [...Array(TOTAL_CELDAS).keys()];
  const candidatasAVaciar = mezclar(todasLasCeldas.filter((indice) => fijas[indice] === 0));
  let pistasRestantes = TOTAL_CELDAS;

  for (const indice of candidatasAVaciar) {
    if (pistasRestantes <= pistas) break;

    const valor = puzzle[indice];
    puzzle[indice] = 0;

    if (contarSoluciones(puzzle) === 1) {
      pistasRestantes--;
    } else {
      puzzle[indice] = valor; // vaciarla dejaba más de una solución
    }
  }

  return { puzzle, solucion };
}
