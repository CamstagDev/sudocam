// Lo que pasa en el guardado cuando el jugador gana una partida.

import { obtenerGuardado } from '../save/guardado.js';
import { registrarSudokuCompletado } from './sudoku/partidas-en-pausa.js';
import { desbloquearLogros, logrosPorSudokus } from './logros/logros.js';

// Un sudoku normal o multi sudoku ganado: suma al contador de su
// dificultad y desbloquea los logros que correspondan. Devuelve los
// logros recién ganados (para mostrar el aviso).
export async function registrarSudokuGanado(dificultad) {
  await registrarSudokuCompletado(dificultad);
  return desbloquearLogros(logrosPorSudokus(obtenerGuardado(), dificultad));
}
