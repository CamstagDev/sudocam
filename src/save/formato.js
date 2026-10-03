// Forma del archivo de guardado de SudoCam.
//
// Todo el progreso del jugador vive en un único objeto JSON:
//
//   {
//     formato: 'sudocam-save',     para reconocer el archivo al importarlo
//     version: 1,                  versión de ESTA forma (ver migraciones.js)
//     appVersion: '0.1.0',         versión del juego que lo escribió por última vez
//     creado / actualizado:        fechas ISO
//     perfil: { tema, preferencias },          null = valores por defecto
//     partidasEnPausa: [ ... ],                ver game/sudoku/partidas-en-pausa.js
//     estadisticas: { sudokusCompletados: { facil, medio, dificil, personalizado } },
//     jefes: { },                              llegarán con los jefes
//     logros: { },                             id del logro -> fecha
//   }
//
// Si cambia esta forma, se sube VERSION_GUARDADO y se agrega una migración
// en migraciones.js para convertir los guardados viejos.

import { VERSION_APP } from '../version.js';

export const FORMATO = 'sudocam-save';
export const VERSION_GUARDADO = 1;

export function crearGuardadoNuevo() {
  const ahora = new Date().toISOString();
  return {
    formato: FORMATO,
    version: VERSION_GUARDADO,
    appVersion: VERSION_APP,
    creado: ahora,
    actualizado: ahora,
    perfil: { tema: null, preferencias: null },
    partidasEnPausa: [],
    estadisticas: {
      sudokusCompletados: { facil: 0, medio: 0, dificil: 0, personalizado: 0 },
    },
    jefes: {},
    logros: {},
  };
}

function esObjeto(valor) {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

// Revisa que `datos` sea un guardado de SudoCam con la versión actual y
// completa lo que le falte con los valores por defecto. Lanza un Error con
// un mensaje para el jugador si no sirve. Los campos que no conoce se
// conservan tal cual (pueden venir de una versión más nueva del juego).
export function normalizarGuardado(datos) {
  if (!esObjeto(datos) || datos.formato !== FORMATO) {
    throw new Error('Este archivo no es un guardado de SudoCam.');
  }
  if (datos.version !== VERSION_GUARDADO) {
    throw new Error(`Versión de guardado inesperada: ${datos.version}.`);
  }

  const base = crearGuardadoNuevo();
  return {
    ...base,
    ...datos,
    perfil: { ...base.perfil, ...(esObjeto(datos.perfil) ? datos.perfil : {}) },
    partidasEnPausa: Array.isArray(datos.partidasEnPausa) ? datos.partidasEnPausa : [],
    estadisticas: {
      ...base.estadisticas,
      ...(esObjeto(datos.estadisticas) ? datos.estadisticas : {}),
      sudokusCompletados: {
        ...base.estadisticas.sudokusCompletados,
        ...(esObjeto(datos.estadisticas?.sudokusCompletados) ? datos.estadisticas.sudokusCompletados : {}),
      },
    },
    jefes: esObjeto(datos.jefes) ? datos.jefes : {},
    logros: esObjeto(datos.logros) ? datos.logros : {},
  };
}
