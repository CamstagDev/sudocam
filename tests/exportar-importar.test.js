import { beforeEach, describe, expect, it } from 'vitest';
import { crearAlmacenEnMemoria } from '../src/save/almacen-navegador.js';
import {
  borrarProgreso,
  iniciarGuardado,
  leerTextoDeGuardado,
  modificarGuardado,
  obtenerGuardado,
  reemplazarGuardado,
} from '../src/save/guardado.js';
import { resumirGuardado } from '../src/save/resumen.js';
import { nombreDeArchivoSugerido } from '../src/save/archivos.js';

let almacen;

beforeEach(async () => {
  almacen = crearAlmacenEnMemoria();
  await iniciarGuardado(almacen);
});

describe('exportar e importar', () => {
  it('un guardado exportado se vuelve a leer igual', async () => {
    await modificarGuardado((g) => {
      g.logros.primer_sudoku = '2026-10-03T00:00:00Z';
      g.estadisticas.sudokusCompletados.medio = 4;
    });
    const texto = JSON.stringify(obtenerGuardado(), null, 2);
    expect(leerTextoDeGuardado(texto)).toEqual(obtenerGuardado());
  });

  it('rechaza archivos que no son JSON o no son de SudoCam', () => {
    expect(() => leerTextoDeGuardado('hola')).toThrow('no es un JSON válido');
    expect(() => leerTextoDeGuardado('{"otro": "juego"}')).toThrow();
  });

  it('importar deja aparte el progreso anterior', async () => {
    await modificarGuardado((g) => { g.logros.sudoku_facil = '2026-10-01T00:00:00Z'; });
    const importado = leerTextoDeGuardado(JSON.stringify({ formato: 'sudocam-save', version: 1 }));

    await reemplazarGuardado(importado);

    expect(obtenerGuardado().logros).toEqual({});
    expect(JSON.parse(almacen.archivos.get('antes-de-importar')).logros.sudoku_facil).toBeDefined();
  });

  it('borrar todo empieza de cero y deja una copia', async () => {
    await modificarGuardado((g) => { g.estadisticas.sudokusCompletados.facil = 7; });
    await borrarProgreso();
    expect(resumirGuardado(obtenerGuardado()).sudokusCompletados).toBe(0);
    expect(JSON.parse(almacen.archivos.get('antes-de-borrar')).estadisticas.sudokusCompletados.facil).toBe(7);
  });

  it('el nombre sugerido lleva la fecha', () => {
    expect(nombreDeArchivoSugerido(new Date('2026-10-03T12:00:00Z'))).toBe('sudocam-guardado-2026-10-03.json');
  });
});
