// Con qué se conectan los dos teléfonos de un duelo:
//  - En la app de Android, Nearby Connections (teléfono a teléfono, sin
//    internet; ver transportes/nearby.js).
//  - En desarrollo (`npm run dev`), dos pestañas del navegador (ver
//    transportes/pestanas.js), para probar sin teléfonos.
// En cualquier otro lado (la versión web publicada, Windows) no hay cómo, y
// el modo Duelo no aparece.

import { Capacitor } from '@capacitor/core';
import { transporteNearby } from './transportes/nearby.js';
import { transporteEntrePestanas } from './transportes/pestanas.js';

// El transporte que se puede usar aquí, o null si no hay ninguno.
export function transporteDisponible() {
  if (Capacitor.isPluginAvailable('NearbyDuelo')) return transporteNearby;
  if (import.meta.env?.DEV && typeof BroadcastChannel !== 'undefined') return transporteEntrePestanas;
  return null;
}

export const esTransporteDePrueba = (transporte) => transporte?.nombre === 'pestanas';
