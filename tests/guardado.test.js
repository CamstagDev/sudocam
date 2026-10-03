import { describe, expect, it } from 'vitest';
import { FORMATO, VERSION_GUARDADO, crearGuardadoNuevo, normalizarGuardado } from '../src/save/formato.js';
import { migrarGuardado } from '../src/save/migraciones.js';
import { crearAlmacenEnMemoria } from '../src/save/almacen-navegador.js';
import { iniciarGuardado, modificarGuardado, obtenerGuardado } from '../src/save/guardado.js';

describe('normalizarGuardado', () => {
  it('rechaza lo que no es un guardado de SudoCam', () => {
    expect(() => normalizarGuardado({ hola: 1 })).toThrow('no es un guardado de SudoCam');
    expect(() => normalizarGuardado(null)).toThrow();
  });

  it('completa los campos que faltan y conserva los desconocidos', () => {
    const guardado = normalizarGuardado({
      formato: FORMATO,
      version: VERSION_GUARDADO,
      estadisticas: { sudokusCompletados: { facil: 3 } },
      campoDelFuturo: 'se queda',
    });

    expect(guardado.estadisticas.sudokusCompletados).toEqual({ facil: 3, medio: 0, dificil: 0, personalizado: 0 });
    expect(guardado.partidasEnPausa).toEqual([]);
    expect(guardado.campoDelFuturo).toBe('se queda');
  });
});

describe('migrarGuardado', () => {
  const migracionesDePrueba = {
    1: (g) => ({ ...g, version: 2, ajustes: { sonido: true } }),
    2: (g) => ({ ...g, version: 3, ajustes: { ...g.ajustes, vibracion: false } }),
  };

  it('aplica las migraciones en cadena', () => {
    const resultado = migrarGuardado({ version: 1 }, migracionesDePrueba, 3);
    expect(resultado).toEqual({ version: 3, ajustes: { sonido: true, vibracion: false } });
  });

  it('no toca un guardado que ya está al día', () => {
    const guardado = { version: 3 };
    expect(migrarGuardado(guardado, migracionesDePrueba, 3)).toBe(guardado);
  });

  it('rechaza un guardado de una versión más nueva', () => {
    expect(() => migrarGuardado({ version: 4 }, migracionesDePrueba, 3)).toThrow('versión más nueva');
  });

  it('avisa si falta un paso de la cadena', () => {
    expect(() => migrarGuardado({ version: 1 }, {}, 2)).toThrow('Falta la migración');
  });
});

describe('iniciarGuardado', () => {
  it('sin nada guardado, empieza uno nuevo y lo escribe', async () => {
    const almacen = crearAlmacenEnMemoria();
    const aviso = await iniciarGuardado(almacen);

    expect(aviso).toBeNull();
    expect(JSON.parse(almacen.archivos.get('principal')).formato).toBe(FORMATO);
    expect(almacen.archivos.has('copia')).toBe(true);
  });

  it('carga lo guardado y escribe los cambios', async () => {
    const previo = crearGuardadoNuevo();
    previo.logros.primer_sudoku = '2026-10-03';
    const almacen = crearAlmacenEnMemoria({ principal: JSON.stringify(previo) });

    await iniciarGuardado(almacen);
    expect(obtenerGuardado().logros.primer_sudoku).toBe('2026-10-03');

    await modificarGuardado((g) => {
      g.estadisticas.sudokusCompletados.facil++;
    });
    expect(JSON.parse(almacen.archivos.get('principal')).estadisticas.sudokusCompletados.facil).toBe(1);
  });

  it('si el guardado está dañado, recupera la copia y aparta el dañado', async () => {
    const copia = crearGuardadoNuevo();
    copia.logros.sudokus_5 = '2026-10-01';
    const almacen = crearAlmacenEnMemoria({ principal: '{ esto no es json', copia: JSON.stringify(copia) });

    const aviso = await iniciarGuardado(almacen);

    expect(aviso).toContain('copia de seguridad');
    expect(obtenerGuardado().logros.sudokus_5).toBe('2026-10-01');
    expect(almacen.archivos.get('danado')).toBe('{ esto no es json');
  });

  it('si también la copia falla, empieza de cero sin romperse', async () => {
    const almacen = crearAlmacenEnMemoria({ principal: 'basura', copia: 'más basura' });
    const aviso = await iniciarGuardado(almacen);

    expect(aviso).toContain('Se empezó uno nuevo');
    expect(obtenerGuardado().partidasEnPausa).toEqual([]);
  });
});
