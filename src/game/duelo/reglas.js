// Lo que se puede ajustar del modo Duelo sin tocar el resto: su nombre,
// qué dificultades puede elegir quien crea el duelo y la versión del
// protocolo (subirla si cambian los mensajes de sesion.js, para que dos
// teléfonos con versiones distintas no jueguen con reglas distintas).
//
// Las reglas son las de Uriel: los dos llenan el mismo tablero y cada
// casilla es de quien escribe primero el número correcto. Gana quien se
// anote más casillas; con los mismos puntos es empate.

export const NOMBRE_DUELO = 'Duelo';

export const DIFICULTADES_DUELO = ['facil', 'medio', 'dificil'];
export const DIFICULTAD_DUELO_POR_DEFECTO = 'facil';

export const VERSION_PROTOCOLO = 1;
