// Migraciones del archivo de guardado.
//
// Cuando cambie la forma del guardado (ver formato.js):
//   1. se sube VERSION_GUARDADO en formato.js, y
//   2. se agrega aquí una función que convierte la versión anterior en la
//      nueva, con la versión de origen como clave.
//
// Ejemplo de cómo se vería la primera:
//
//   1: (guardado) => {
//     guardado.ajustes = { sonido: true };   // campo nuevo en la v2
//     return { ...guardado, version: 2 };
//   },
//
// Las migraciones se aplican en cadena (1 -> 2 -> 3 ...) al cargar el
// guardado y al importar un archivo, así que un guardado muy viejo llega
// siempre a la versión actual.

import { VERSION_GUARDADO } from './formato.js';

export const MIGRACIONES = {};

// Devuelve el guardado convertido a la versión actual. Lanza un Error si
// viene de una versión más nueva del juego (no sabemos leerlo) o si falta
// algún paso de la cadena.
export function migrarGuardado(guardado, migraciones = MIGRACIONES, versionActual = VERSION_GUARDADO) {
  let resultado = guardado;

  if (!Number.isInteger(resultado?.version) || resultado.version < 1) {
    throw new Error('El guardado no tiene una versión válida.');
  }
  if (resultado.version > versionActual) {
    throw new Error('Este guardado es de una versión más nueva de SudoCam. Actualiza el juego para abrirlo.');
  }

  while (resultado.version < versionActual) {
    const migrar = migraciones[resultado.version];
    if (!migrar) {
      throw new Error(`Falta la migración del guardado desde la versión ${resultado.version}.`);
    }
    resultado = migrar(structuredClone(resultado));
  }

  return resultado;
}
