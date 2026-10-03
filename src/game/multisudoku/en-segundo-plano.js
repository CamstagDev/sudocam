// Genera un multi sudoku en un hilo aparte (generador-worker.js) para que
// la pantalla siga respondiendo mientras tanto: los tableros grandes en
// difícil pueden tardar alrededor de un segundo. Si el navegador no puede
// crear el hilo, genera aquí mismo como último recurso.
//
//   const { puzzle, solucion } = await generarEnSegundoPlano({ cantidad: 5, pistasPorGrilla: 26 });

import { generarMultiSudoku } from './generador.js';

export function generarEnSegundoPlano(opciones) {
  let hilo;
  try {
    hilo = new Worker(new URL('./generador-worker.js', import.meta.url), { type: 'module' });
  } catch {
    return Promise.resolve(generarMultiSudoku(opciones));
  }

  return new Promise((resolver, rechazar) => {
    hilo.addEventListener('message', ({ data }) => {
      hilo.terminate();
      if (data.error) rechazar(new Error(data.error));
      else resolver(data);
    });
    hilo.addEventListener('error', () => {
      hilo.terminate();
      resolver(generarMultiSudoku(opciones));
    });
    hilo.postMessage(opciones);
  });
}
