// Corre la generación de un multi sudoku en un hilo aparte (Web Worker),
// para que la pantalla no se congele mientras tanto. Recibe
// { cantidad, pistasPorGrilla } y responde { puzzle, solucion } o
// { error }. Ver en-segundo-plano.js, que es quien lo usa.

import { generarMultiSudoku } from './generador.js';

self.addEventListener('message', ({ data }) => {
  try {
    self.postMessage(generarMultiSudoku(data));
  } catch (error) {
    self.postMessage({ error: error.message });
  }
});
