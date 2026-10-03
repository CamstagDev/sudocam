// Sacar el guardado a un archivo y traerlo de vuelta (exportar/importar).
//
// En Windows se usan los diálogos de "Guardar como" y "Abrir" del sistema
// (ver electron/main.js). En el navegador, el archivo se descarga y se
// elige con el selector de archivos.

import { estamosEnEscritorio } from './almacen-escritorio.js';

// sudocam-guardado-2026-10-03.json
export function nombreDeArchivoSugerido(fecha = new Date()) {
  return `sudocam-guardado-${fecha.toISOString().slice(0, 10)}.json`;
}

// Devuelve true si el archivo se guardó, false si el jugador canceló.
export async function exportarTexto(texto, nombre = nombreDeArchivoSugerido()) {
  if (estamosEnEscritorio()) {
    return window.sudocamEscritorio.exportar(nombre, texto);
  }

  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(new Blob([texto], { type: 'application/json' }));
  enlace.download = nombre;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
  return true;
}

// Devuelve el texto del archivo elegido, o null si el jugador canceló.
export async function elegirArchivoParaImportar() {
  if (estamosEnEscritorio()) {
    return window.sudocamEscritorio.importar();
  }

  return new Promise((resolver) => {
    const selector = document.createElement('input');
    selector.type = 'file';
    selector.accept = '.json,application/json';
    selector.addEventListener('change', async () => {
      const archivo = selector.files[0];
      resolver(archivo ? await archivo.text() : null);
    });
    selector.addEventListener('cancel', () => resolver(null));
    selector.click();
  });
}
