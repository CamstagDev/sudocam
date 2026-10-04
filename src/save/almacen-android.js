// Almacén del guardado en la app de Android (Capacitor): archivos .json en
// la carpeta privada de la app (Directory.Data), que Android borra solo si
// se desinstala el juego. Misma interfaz que almacen-navegador.js.

import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';

const CARPETA = 'guardado';
const ruta = (nombre) => `${CARPETA}/${nombre}.json`;

export function estamosEnAndroid() {
  return Capacitor.getPlatform() === 'android';
}

export const almacenAndroid = {
  async leer(nombre) {
    try {
      const { data } = await Filesystem.readFile({ path: ruta(nombre), directory: Directory.Data, encoding: Encoding.UTF8 });
      return data;
    } catch {
      return null; // todavía no existe
    }
  },

  // Primero un archivo temporal y después se renombra: si el juego se
  // cierra a mitad de la escritura, el guardado anterior queda intacto.
  async escribir(nombre, texto) {
    const temporal = `${ruta(nombre)}.tmp`;
    await Filesystem.writeFile({
      path: temporal,
      data: texto,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    await Filesystem.rename({ from: temporal, to: ruta(nombre), directory: Directory.Data, toDirectory: Directory.Data });
  },
};
