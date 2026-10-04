// Un jefe bloqueado no se insinúa en ninguna parte: ni sus logros, ni los
// contadores, ni el resumen del guardado. La única excepción es "Cazador
// de jefes", que puede adelantar cuántos jefes hay.

import { beforeEach, describe, expect, it } from 'vitest';
import { crearAlmacenEnMemoria } from '../src/save/almacen-navegador.js';
import { iniciarGuardado, modificarGuardado, obtenerGuardado } from '../src/save/guardado.js';
import { JEFES } from '../src/game/jefes/catalogo.js';
import { hayJefesDesbloqueados, jefeDesbloqueado } from '../src/game/jefes/registro.js';
import { CATALOGO, SECCIONES } from '../src/game/logros/catalogo.js';
import { logrosVisibles, logrosVisiblesConEstado } from '../src/game/logros/visibles.js';
import { filasDelResumen, resumirGuardado } from '../src/save/resumen.js';

const idsVisibles = () => logrosVisibles().map((logro) => logro.id);
const logrosDeJefe = (jefe) => CATALOGO.filter((logro) => logro.jefe === jefe).map((logro) => logro.id);

beforeEach(async () => {
  await iniciarGuardado(crearAlmacenEnMemoria());
});

describe('catálogo de logros', () => {
  it('todo logro de la sección Jefes nombra a su jefe, salvo "Cazador de jefes"', () => {
    const deJefes = SECCIONES.find((seccion) => seccion.id === 'jefes').logros;
    for (const logro of deJefes) {
      if (logro.id === 'todos_los_jefes') expect(logro.jefe).toBeUndefined();
      else expect(JEFES[logro.jefe], logro.id).toBeDefined();
    }
  });
});

describe('sin jefes desbloqueados', () => {
  it('no hay ningún jefe a la vista', () => {
    expect(hayJefesDesbloqueados()).toBe(false);
  });

  it('el único logro de jefes que se ve es "Cazador de jefes"', () => {
    const visibles = logrosVisibles();
    expect(visibles.filter((logro) => logro.jefe)).toEqual([]);
    expect(idsVisibles()).toContain('todos_los_jefes');
  });

  it('"Cazador de jefes" sigue mostrando cuántos jefes hay', () => {
    const cazador = logrosVisiblesConEstado().find((logro) => logro.id === 'todos_los_jefes');
    expect(cazador.progreso).toEqual({ actual: 0, objetivo: 5 });
  });

  it('el resumen del guardado no cuenta logros de jefes ni muestra "Jefes vencidos"', () => {
    const resumen = resumirGuardado(obtenerGuardado());
    expect(resumen.totalLogros).toBe(CATALOGO.filter((logro) => !logro.jefe).length);
    expect(filasDelResumen(resumen).map(([etiqueta]) => etiqueta)).not.toContain('Jefes vencidos');
  });
});

describe('al desbloquear jefes', () => {
  it('desbloquear a Uriel muestra solo sus logros, no los de los demás', async () => {
    await modificarGuardado((g) => { g.logros.sudoku_facil = '2026-10-04T00:00:00Z'; });

    expect(hayJefesDesbloqueados()).toBe(true);
    expect(idsVisibles()).toEqual(expect.arrayContaining(logrosDeJefe('uriel')));
    for (const otro of ['hecate', 'jormungandr', 'babel', 'typhon', 'uriel_uber']) {
      expect(idsVisibles()).not.toEqual(expect.arrayContaining(logrosDeJefe(otro)));
    }
  });

  it('con un jefe desbloqueado, el resumen ya muestra "Jefes vencidos"', async () => {
    await modificarGuardado((g) => { g.logros.sudoku_facil = '2026-10-04T00:00:00Z'; });
    const filas = filasDelResumen(resumirGuardado(obtenerGuardado()));
    expect(filas).toContainEqual(['Jefes vencidos', '0']);
  });

  it('los logros de un uber esperan a que se desbloquee el uber, no solo su versión normal', async () => {
    await modificarGuardado((g) => {
      g.jefes.jormungandr = { victorias: 1, mejorTiempo: 2000, victoriasRapidas: 0, mejorMarca: null };
    });
    expect(jefeDesbloqueado('babel')).toBe(true);
    expect(idsVisibles()).toContain('babel_derrotado_facil');
    expect(idsVisibles()).not.toContain('babel_uber_derrotado');

    await modificarGuardado((g) => { g.logros.babel_derrotado_dificil = '2026-10-04T00:00:00Z'; });
    expect(idsVisibles()).toContain('babel_uber_derrotado');
  });
});

describe('el resumen de otro guardado (antes de importarlo)', () => {
  it('decide qué ocultar según ese guardado, no según el actual', async () => {
    await modificarGuardado((g) => { g.logros.sudoku_facil = '2026-10-04T00:00:00Z'; });
    const otro = structuredClone(obtenerGuardado());
    otro.logros = {};

    expect(jefeDesbloqueado('uriel', otro)).toBe(false);
    expect(filasDelResumen(resumirGuardado(otro)).map(([etiqueta]) => etiqueta)).not.toContain('Jefes vencidos');
  });
});
