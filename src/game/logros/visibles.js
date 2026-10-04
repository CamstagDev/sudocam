// Qué logros puede ver el jugador.
//
// Los logros de un jefe (los que llevan `jefe` en el catálogo) quedan
// ocultos del todo, también en los contadores, hasta desbloquear a ese
// jefe: si no, delatarían que existe.

import { obtenerGuardado } from '../../save/guardado.js';
import { jefeDesbloqueado } from '../jefes/registro.js';
import { CATALOGO } from './catalogo.js';
import { logrosConEstado } from './logros.js';

export function logroVisible(logro, guardado = obtenerGuardado()) {
  return !logro.jefe || jefeDesbloqueado(logro.jefe, guardado);
}

export function logrosVisibles(guardado = obtenerGuardado()) {
  return CATALOGO.filter((logro) => logroVisible(logro, guardado));
}

// Como logrosConEstado(), pero sin los logros ocultos.
export function logrosVisiblesConEstado() {
  const guardado = obtenerGuardado();
  return logrosConEstado().filter((logro) => logroVisible(logro, guardado));
}
