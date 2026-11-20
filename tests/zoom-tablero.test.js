import { describe, expect, it } from 'vitest';
import {
  ZOOM_MAXIMO,
  ZOOM_MINIMO,
  desplazamientoTrasZoom,
  limitarZoom,
  zoomDelPellizco,
} from '../src/ui/zoom-tablero.js';

describe('zoom del tablero', () => {
  it('no baja del tamaño normal ni pasa del máximo', () => {
    expect(limitarZoom(0.3)).toBe(ZOOM_MINIMO);
    expect(limitarZoom(99)).toBe(ZOOM_MAXIMO);
    expect(limitarZoom(2.5)).toBe(2.5);
  });

  it('el pellizco cambia el zoom en la proporción de la distancia entre los dedos', () => {
    expect(zoomDelPellizco(1, 100, 200)).toBe(2);
    expect(zoomDelPellizco(2, 100, 50)).toBe(1);
    expect(zoomDelPellizco(3, 100, 400)).toBe(ZOOM_MAXIMO);
    expect(zoomDelPellizco(1.5, 0, 80)).toBe(1.5);
  });

  it('el punto bajo los dedos se queda en su lugar al acercar', () => {
    // Punto a 100 px del borde visible, sin desplazamiento: al doblar el
    // tamaño ese punto queda a 200 px, así que hay que desplazar 100.
    expect(desplazamientoTrasZoom(0, 100, 2)).toBe(100);
    expect(desplazamientoTrasZoom(50, 100, 2)).toBe(200);
    // Al volver al tamaño normal no queda desplazamiento negativo.
    expect(desplazamientoTrasZoom(100, 100, 0.5)).toBe(0);
  });
});
