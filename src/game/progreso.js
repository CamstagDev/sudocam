// Lo que pasa en el guardado cuando el jugador gana una partida.

import { obtenerGuardado } from '../save/guardado.js';
import { registrarSudokuCompletado } from './sudoku/partidas-en-pausa.js';
import { desbloquearLogros, logrosPorSudokus } from './logros/logros.js';
import { MODO_SUDOKU, registrarTiempo } from './estadisticas.js';

// Un sudoku normal o multi sudoku ganado: suma al contador de su
// dificultad, anota el tiempo (ver game/estadisticas.js) y desbloquea los
// logros que correspondan. Devuelve los logros recién ganados (para
// mostrar el aviso).
//   modo: 'sudoku' o el de su multi sudoku (modoMulti(3) -> 'multi3')
export async function registrarSudokuGanado(dificultad, { segundos, modo = MODO_SUDOKU } = {}) {
  await registrarSudokuCompletado(dificultad);
  if (segundos !== undefined) await registrarTiempo({ modo, dificultad, segundos });
  return desbloquearLogros(logrosPorSudokus(obtenerGuardado(), dificultad));
}
