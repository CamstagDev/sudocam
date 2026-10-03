// Preferencias de juego. Por ahora siempre son las de por defecto; en el
// paso de Personalización se leerán del archivo de guardado.

export const PREFERENCIAS_POR_DEFECTO = {
  resaltarRelacionadas: true, // fila, columna y caja de la celda elegida
  resaltarIguales: true, // celdas con el mismo número que la elegida
  mostrarCronometro: true,
};

export function leerPreferencias() {
  return { ...PREFERENCIAS_POR_DEFECTO };
}
