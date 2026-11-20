// Vibración del teléfono en momentos clave del juego. Solo en Android (la
// app de Capacitor); en Windows y en el navegador no hace nada. Se puede
// apagar en Personalización → Preferencias.
//
//   vibrar('error');      número equivocado a la vista (o "Comprobar" con errores)
//   vibrar('victoria');   tablero resuelto
//   vibrar('ataque');     un jefe disparó una habilidad
//
// Usa el plugin de Capacitor Haptics, que ya trae el permiso de vibrar.

import { Capacitor } from '@capacitor/core';
import { Haptics } from '@capacitor/haptics';
import { leerPreferencias } from './preferencias.js';

// Cada vibración es una lista de pulsos en milisegundos (con la pausa
// entre uno y otro).
export const PATRONES = {
  error: { pulsos: [70], pausa: 0 },
  victoria: { pulsos: [90, 90, 220], pausa: 90 },
  ataque: { pulsos: [40, 40], pausa: 60 },
};

export const vibracionDisponible = (plataforma = Capacitor.getPlatform()) => plataforma === 'android';

export function debeVibrar(tipo, { plataforma, preferencias }) {
  return Boolean(PATRONES[tipo]) && vibracionDisponible(plataforma) && preferencias.vibracion;
}

const esperar = (ms) => new Promise((listo) => setTimeout(listo, ms));

// Si varias cosas piden vibrar casi a la vez (dos habilidades en el mismo
// segundo), basta con la primera.
const SEPARACION_MINIMA_MS = 250;
let ultimaVibracion = 0;

export async function vibrar(tipo) {
  if (!debeVibrar(tipo, { plataforma: Capacitor.getPlatform(), preferencias: leerPreferencias() })) return;
  if (Date.now() - ultimaVibracion < SEPARACION_MINIMA_MS) return;
  ultimaVibracion = Date.now();
  const { pulsos, pausa } = PATRONES[tipo];
  try {
    for (const [i, duracion] of pulsos.entries()) {
      if (i > 0) await esperar(pausa);
      await Haptics.vibrate({ duration: duracion });
      await esperar(duracion);
    }
  } catch {
    // Un teléfono sin motor de vibración no es un error del juego.
  }
}
