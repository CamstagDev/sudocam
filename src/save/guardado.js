// El guardado del jugador mientras el juego está abierto.
//
// Se carga una sola vez al arrancar (iniciarGuardado) y desde ahí vive en
// memoria. Las pantallas lo leen con obtenerGuardado() y lo cambian con
// modificarGuardado(), que además lo escribe en el almacén.
//
//   await iniciarGuardado();
//   const { partidasEnPausa } = obtenerGuardado();
//   await modificarGuardado((guardado) => { guardado.logros.primer_sudoku = fecha; });
//
// Copias de seguridad:
//  - 'copia': el último guardado que se cargó bien, escrito al arrancar.
//    Si el principal se corrompe, se recupera desde aquí.
//  - 'antes-de-migrar-vN': el guardado tal como estaba antes de convertirlo
//    desde la versión N.

import { VERSION_APP } from '../version.js';
import { crearGuardadoNuevo, normalizarGuardado } from './formato.js';
import { migrarGuardado } from './migraciones.js';
import { almacenNavegador } from './almacen-navegador.js';

let almacen = almacenNavegador;
let guardado = null;

// Escrituras en fila: cada una espera a la anterior, así nunca se pisan.
let escrituraPendiente = Promise.resolve();

// Convierte un texto (lo leído del almacén o un archivo importado) en un
// guardado listo para usar, migrándolo si es viejo. Lanza un Error con un
// mensaje para el jugador si no sirve.
export function leerTextoDeGuardado(texto) {
  let datos;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new Error('El archivo está dañado: no es un JSON válido.');
  }
  return normalizarGuardado(migrarGuardado(datos));
}

async function leerDelAlmacen(nombre) {
  const texto = await almacen.leer(nombre);
  if (texto === null) return null;
  return { texto, guardado: leerTextoDeGuardado(texto) };
}

// Carga el guardado al arrancar. Devuelve un aviso para el jugador si algo
// salió raro (por ejemplo, se tuvo que usar la copia de seguridad), o null.
export async function iniciarGuardado(almacenAUsar = almacenNavegador) {
  almacen = almacenAUsar;
  let aviso = null;
  let cargado = null;

  try {
    cargado = await leerDelAlmacen('principal');
  } catch (error) {
    // Se aparta el guardado dañado tal cual, por si se puede rescatar a mano.
    await almacen.escribir('danado', await almacen.leer('principal'));
    aviso = `No se pudo leer tu guardado (${error.message}). Se recuperó la copia de seguridad.`;
    try {
      cargado = await leerDelAlmacen('copia');
    } catch {
      cargado = null;
    }
    if (!cargado) {
      aviso = `No se pudo leer tu guardado (${error.message}) ni su copia de seguridad. Se empezó uno nuevo.`;
    }
  }

  if (cargado) {
    const versionOriginal = JSON.parse(cargado.texto).version;
    if (versionOriginal !== cargado.guardado.version) {
      await almacen.escribir(`antes-de-migrar-v${versionOriginal}`, cargado.texto);
    }
    guardado = cargado.guardado;
  } else {
    guardado = crearGuardadoNuevo();
  }

  await persistir();
  await almacen.escribir('copia', JSON.stringify(guardado));
  return aviso;
}

export function obtenerGuardado() {
  if (!guardado) throw new Error('El guardado todavía no se cargó (falta iniciarGuardado).');
  return guardado;
}

function persistir() {
  guardado.actualizado = new Date().toISOString();
  guardado.appVersion = VERSION_APP;
  const texto = JSON.stringify(guardado);
  escrituraPendiente = escrituraPendiente.then(() => almacen.escribir('principal', texto));
  return escrituraPendiente;
}

// Aplica `cambio(guardado)` y escribe el resultado. Devuelve lo que
// devuelva `cambio`.
export async function modificarGuardado(cambio) {
  const resultado = cambio(obtenerGuardado());
  await persistir();
  return resultado;
}

// Reemplaza todo el guardado (lo usará "Importar guardado").
export async function reemplazarGuardado(nuevo) {
  await almacen.escribir('antes-de-importar', JSON.stringify(obtenerGuardado()));
  guardado = nuevo;
  await persistir();
}
