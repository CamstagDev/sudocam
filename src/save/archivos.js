// Sacar el guardado a un archivo y traerlo de vuelta (exportar/importar).
//
// En Windows se usan los diálogos de "Guardar como" y "Abrir" del sistema
// (ver electron/main.js). En Android se abre el menú "Compartir" (para
// mandarlo a Drive, a un chat, a Archivos...). En el navegador, el archivo
// se descarga. Para importar, Android y el navegador usan el selector de
// archivos normal.

import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { estamosEnEscritorio } from './almacen-escritorio.js';
import { estamosEnAndroid } from './almacen-android.js';

// sudocam-guardado-2026-10-03.json
export function nombreDeArchivoSugerido(fecha = new Date()) {
  return `sudocam-guardado-${fecha.toISOString().slice(0, 10)}.json`;
}

// Devuelve true si el archivo se guardó, false si el jugador canceló.
export async function exportarTexto(texto, nombre = nombreDeArchivoSugerido()) {
  if (estamosEnEscritorio()) {
    return window.sudocamEscritorio.exportar(nombre, texto);
  }

  if (estamosEnAndroid()) {
    const { uri } = await Filesystem.writeFile({ path: nombre, data: texto, directory: Directory.Cache, encoding: Encoding.UTF8 });
    try {
      await Share.share({ title: 'Guardado de SudoCam', files: [uri] });
      return true;
    } catch {
      return false; // el jugador cerró el menú de compartir
    }
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
