// Con qué se conectan los dos teléfonos de un duelo. Por ahora solo
// existe el transporte de prueba entre pestañas, y solo en desarrollo
// (`npm run dev`): en el juego publicado el modo Duelo no aparece hasta
// que esté el de Nearby Connections para Android (teléfono a teléfono,
// sin internet).

import { transporteEntrePestanas } from './transportes/pestanas.js';

// El transporte que se puede usar aquí, o null si no hay ninguno.
export function transporteDisponible() {
  if (import.meta.env?.DEV && typeof BroadcastChannel !== 'undefined') return transporteEntrePestanas;
  return null;
}

export const esTransporteDePrueba = (transporte) => transporte?.nombre === 'pestanas';
