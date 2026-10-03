// Las dificultades del sudoku 9x9 y lo que implica cada una.
//
// politicaErrores decide cuándo se le muestran los errores al jugador:
//  - instantaneo: apenas escribe un número.
//  - boton: solo al presionar "Comprobar".
//  - final: solo cuando el tablero queda completo.

export const DIFICULTADES = {
  facil: {
    nombre: 'Fácil',
    pistas: 40,
    politicaErrores: 'instantaneo',
    descripcion: 'Los errores se marcan al instante mientras juegas.',
  },
  medio: {
    nombre: 'Medio',
    pistas: 32,
    politicaErrores: 'boton',
    descripcion: 'Revisa los errores cuando quieras con el botón Comprobar.',
  },
  dificil: {
    nombre: 'Difícil',
    pistas: 26,
    politicaErrores: 'final',
    descripcion: 'No hay ningún aviso de errores: te la juegas hasta completar el tablero.',
  },
  personalizado: {
    nombre: 'Personalizado',
    pistas: 32,
    politicaErrores: 'instantaneo',
    descripcion: 'Elige tú cuándo se muestran los errores y cuántos números empiezan puestos.',
  },
};

export const POLITICAS_ERRORES = {
  instantaneo: 'Al instante',
  boton: 'Con botón',
  final: 'Solo al terminar',
};

// Límites del modo personalizado. Por debajo de 22 pistas casi nunca se
// puede mantener una solución única, y por encima de 55 ya no queda casi
// nada que resolver.
export const PISTAS_PERSONALIZADO_MIN = 22;
export const PISTAS_PERSONALIZADO_MAX = 55;

export function limitarPistasPersonalizado(pistas) {
  if (!Number.isInteger(pistas)) return DIFICULTADES.personalizado.pistas;
  return Math.min(PISTAS_PERSONALIZADO_MAX, Math.max(PISTAS_PERSONALIZADO_MIN, pistas));
}
