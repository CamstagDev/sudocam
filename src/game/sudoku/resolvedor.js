// Resolver tableros de cualquier forma (ver lienzo.js): completarlos al
// azar y contar cuántas soluciones tienen.
//
// Es un backtracking con una sola idea para ir rápido: en cada paso se
// llena primero la celda vacía con MENOS números posibles. Si alguna
// celda se queda sin opciones, el camino muere ahí mismo en vez de seguir
// llenando el resto del tablero a ciegas. Con esto un sudoku difícil se
// genera unas 30 veces más rápido que probando celda por celda en orden.
//
// Los números posibles de una celda se guardan como bits: el bit n
// encendido significa "n se puede poner". Por ejemplo 0b0000010110 =
// {1, 2, 4}.

import { mezclar } from './azar.js';

const TODOS_LOS_DIGITOS = 0b1111111110; // bits 1 a 9

// Bits de los números que todavía caben en `indice`.
function numerosPosibles(tablero, lienzo, indice) {
  let usados = 0;
  for (const vecino of lienzo.vecinos[indice]) usados |= 1 << tablero[vecino];
  return TODOS_LOS_DIGITOS & ~usados;
}

function contarBits(bits) {
  let cantidad = 0;
  for (let resto = bits; resto; resto &= resto - 1) cantidad++;
  return cantidad;
}

function bitsADigitos(bits) {
  const digitos = [];
  for (let digito = 1; digito <= 9; digito++) {
    if (bits & (1 << digito)) digitos.push(digito);
  }
  return digitos;
}

// La celda vacía con menos números posibles, o null si no queda ninguna
// vacía (tablero completo).
function celdaMasRestringida(tablero, lienzo) {
  let mejor = null;
  for (const indice of lienzo.celdas) {
    if (tablero[indice] !== 0) continue;
    const posibles = numerosPosibles(tablero, lienzo, indice);
    const cantidad = contarBits(posibles);
    if (mejor === null || cantidad < mejor.cantidad) {
      mejor = { indice, posibles, cantidad };
      if (cantidad <= 1) break; // no hay nada más restringido que esto
    }
  }
  return mejor;
}

// Llena las celdas vacías de `tablero` (lo modifica) probando los números
// en orden aleatorio, así cada llamada da un tablero distinto. Devuelve
// true si pudo completarlo.
export function completarAlAzar(tablero, lienzo) {
  const celda = celdaMasRestringida(tablero, lienzo);
  if (celda === null) return true;

  for (const digito of mezclar(bitsADigitos(celda.posibles))) {
    tablero[celda.indice] = digito;
    if (completarAlAzar(tablero, lienzo)) return true;
  }
  tablero[celda.indice] = 0;
  return false;
}

// Cuenta las soluciones sin pasar de `limite` (para saber si es única
// basta con ver si aparece una segunda). `presupuesto` limita cuántos
// pasos se prueban: en los multi sudoku más grandes, demostrar que algo es
// único puede tardar muchísimo en casos raros, y ahí se prefiere rendirse.
// Devuelve { soluciones, agotado }; si `agotado` es true, no se sabe.
export function contarSoluciones(tablero, lienzo, { limite = 2, presupuesto = Infinity } = {}) {
  const copia = [...tablero];
  let soluciones = 0;
  let pasos = 0;
  let agotado = false;

  function buscar() {
    if (++pasos > presupuesto) {
      agotado = true;
      return;
    }

    const celda = celdaMasRestringida(copia, lienzo);
    if (celda === null) {
      soluciones++;
      return;
    }

    for (const digito of bitsADigitos(celda.posibles)) {
      copia[celda.indice] = digito;
      buscar();
      copia[celda.indice] = 0;
      if (soluciones >= limite || agotado) return;
    }
  }

  buscar();
  return { soluciones, agotado };
}
