import { beforeEach, describe, expect, it } from 'vitest';
import { crearAlmacenEnMemoria } from '../src/save/almacen-navegador.js';
import { iniciarGuardado, modificarGuardado, obtenerGuardado } from '../src/save/guardado.js';
import {
  CAJAS,
  PeleaUriel,
  buscarJugadaFacil,
  buscarJugadaPorDescarte,
} from '../src/game/jefes/uriel.js';
import { PeleaHecate, SEGUNDOS_TOTALES } from '../src/game/jefes/hecate.js';
import { PeleaJormungandr } from '../src/game/jefes/jormungandr.js';
import {
  estadisticasDeJefe,
  estaCompletamenteInvestigado,
  jefeDesbloqueado,
  registrarVictoriaDeJefe,
} from '../src/game/jefes/registro.js';

const SOLUCION = [
  5, 3, 4, 6, 7, 8, 9, 1, 2,
  6, 7, 2, 1, 9, 5, 3, 4, 8,
  1, 9, 8, 3, 4, 2, 5, 6, 7,
  8, 5, 9, 7, 6, 1, 4, 2, 3,
  4, 2, 6, 8, 5, 3, 7, 9, 1,
  7, 1, 3, 9, 2, 4, 8, 5, 6,
  9, 6, 1, 5, 3, 7, 2, 8, 4,
  2, 8, 7, 4, 1, 9, 6, 3, 5,
  3, 4, 5, 2, 8, 6, 1, 7, 9,
];

function vaciar(indices) {
  return SOLUCION.map((valor, indice) => (indices.includes(indice) ? 0 : valor));
}

describe('búsquedas de Uriel', () => {
  it('fácil: completa la celda que es la única vacía de su fila', () => {
    const tablero = vaciar([0, 10, 20, 30]); // la fila 0 solo tiene vacía la celda 0
    expect(buscarJugadaFacil(tablero, SOLUCION, CAJAS[0])).toEqual({ indice: 0, valor: 5 });
  });

  it('fácil: no ve nada si toda la caja y sus líneas tienen varios huecos', () => {
    const caja = CAJAS[0];
    const vacias = [...caja, 3, 4, 27, 36]; // vacía la caja y además rompe fila 0/1 y columna 0
    const tablero = vaciar([...vacias, 12, 13, 21, 22, 28, 37, 46, 55, 64, 73, 29, 38, 47, 56, 65, 74, 23, 14, 5]);
    expect(buscarJugadaFacil(tablero, SOLUCION, caja)).toBeNull();
  });

  it('un número equivocado del jugador no le sirve de pista, pero lo puede corregir', () => {
    const tablero = vaciar([1]);
    tablero[1] = 9; // equivocado: va un 3
    expect(buscarJugadaFacil(tablero, SOLUCION, CAJAS[0])).toEqual({ indice: 1, valor: 3 });
  });

  it('descarte: encuentra el único hueco posible para un número', () => {
    // Caja 0 con 3 huecos (0, 1, 2) en la misma fila. Faltan el 3, el 4 y
    // el 5; el 3 ya está más abajo en las columnas 0 y 2, así que solo
    // cabe en la celda 1 (el primero que encuentra, porque prueba del 1 al 9).
    const tablero = vaciar([0, 1, 2]);
    expect(buscarJugadaPorDescarte(tablero, SOLUCION, CAJAS[0])).toEqual({ indice: 1, valor: 3 });
  });
});

describe('PeleaUriel', () => {
  function pelea(vacias = [0, 1, 2, 9, 10]) {
    return new PeleaUriel({ tableroInicial: vaciar(vacias), solucion: SOLUCION });
  }

  it('cuenta puntos de cada lado y las casillas de Uriel no se pueden tocar', () => {
    const p = pelea();
    p.colocar(0, 5);
    p.jugadaDelJefe({ indice: 1, valor: 3 });

    expect(p.puntos).toEqual({ jugador: 1, jefe: 1 });
    expect(p.colocar(1, 4)).toBe(false);
    expect(p.borrar(1)).toBe(false);
  });

  it('un número equivocado no suma punto pero cuenta como error', () => {
    const p = pelea();
    p.colocar(0, 9);
    expect(p.puntos.jugador).toBe(0);
    expect(p.errores).toBe(1);
  });

  it('pasa a fase 2 al llenar la mitad, o con el truco del retrato', () => {
    const p = pelea([0, 1, 2, 9]);
    expect(p.fase).toBe(1);
    p.colocar(0, 5);
    p.colocar(1, 1); // equivocado, pero "llenada" igual
    expect(p.fase).toBe(2);

    const otra = pelea();
    otra.faseForzada = true;
    expect(otra.fase).toBe(2);
  });

  it('la búsqueda fácil toca cada 15 s y la de descarte cada 30 s, solo en fase 2', () => {
    const p = pelea();
    const disparos = [];
    for (let s = 1; s <= 30; s++) disparos.push(...p.avanzarUnSegundo());
    expect(disparos).toEqual(['facil', 'facil']);

    p.faseForzada = true;
    const enFase2 = [];
    for (let s = 1; s <= 30; s++) enFase2.push(...p.avanzarUnSegundo());
    expect(enFase2).toEqual(['facil', 'facil', 'descarte']);
  });

  it('sin notas en la versión uber', () => {
    const uber = new PeleaUriel({ tableroInicial: vaciar([0]), solucion: SOLUCION, uber: true });
    expect(uber.alternarNota(0, 5)).toBe(false);
    expect(uber.cajasPorBusqueda).toBe(2);
  });
});

describe('registro de jefes', () => {
  beforeEach(async () => {
    await iniciarGuardado(crearAlmacenEnMemoria());
  });

  it('Uriel se desbloquea al completar un sudoku fácil', async () => {
    expect(jefeDesbloqueado('uriel')).toBe(false);
    await modificarGuardado((g) => { g.logros.sudoku_facil = '2026-10-03'; });
    expect(jefeDesbloqueado('uriel')).toBe(true);
  });

  it('anota victorias, mejor tiempo, victorias rápidas y la mejor marca', async () => {
    await registrarVictoriaDeJefe('uriel', { segundos: 400, errores: 2, usoNotas: true, puntosJefe: 3 });
    await registrarVictoriaDeJefe('uriel', { segundos: 200, errores: 2, usoNotas: false, puntosJefe: 3 });
    await registrarVictoriaDeJefe('uriel', { segundos: 500, errores: 0, usoNotas: false, puntosJefe: 3 });

    const stats = estadisticasDeJefe('uriel');
    expect(stats.victorias).toBe(3);
    expect(stats.mejorTiempo).toBe(200);
    expect(stats.victoriasRapidas).toBe(1);
    expect(stats.mejorMarca).toMatchObject({ errores: 0, segundos: 500 });
  });

  it('da los logros de Uriel, incluido el de no dejarlo anotar', async () => {
    const logros = await registrarVictoriaDeJefe('uriel', { segundos: 300, errores: 1, usoNotas: false, puntosJefe: 0 });
    expect(logros.map((l) => l.id)).toEqual(['uriel_derrotado', 'uriel_aleteo_mariposa']);
    expect(obtenerGuardado().logros.uriel_derrotado).toBeDefined();
  });

  it('investigar por completo a Uriel desbloquea a Uber Uriel', async () => {
    for (let i = 0; i < 5; i++) {
      await registrarVictoriaDeJefe('uriel', { segundos: i === 0 ? 100 : 400, errores: 0, usoNotas: false, puntosJefe: 2 });
    }
    expect(estaCompletamenteInvestigado('uriel')).toBe(true);
    expect(jefeDesbloqueado('uriel_uber')).toBe(true);
  });
});

describe('PeleaHecate', () => {
  // `vacias` empiezan vacías; el resto viene de SOLUCION.
  function pelea(vacias = [0, 1, 2, 9, 10, 11, 18, 19, 20, 40]) {
    return new PeleaHecate({ tableroInicial: vaciar(vacias), solucion: SOLUCION });
  }

  function avanzar(p, segundos) {
    const eventos = [];
    for (let s = 0; s < segundos; s++) eventos.push(...p.avanzarUnSegundo());
    return eventos;
  }

  it('cada error resta un minuto, y sin tiempo es derrota', () => {
    const p = pelea();
    p.colocar(0, 9);
    expect(p.restantes).toBe(SEGUNDOS_TOTALES - 60);

    p.restantes = 30;
    p.colocar(1, 9);
    expect(p.derrotada).toBe(true);
  });

  it('cada 15 s lanza una ilusión sobre una celda vacía, que dura 10 s', () => {
    const p = pelea();
    const [vision] = avanzar(p, 15).filter((e) => e.tipo === 'vision');
    expect(p.tablero[vision.indice]).toBe(0);
    expect(p.disfraz().valores.get(vision.indice)).toBe(vision.valor);
    expect(p.disfraz().fijas.has(vision.indice)).toBe(true);

    avanzar(p, 10);
    expect(p.disfraz().valores.has(vision.indice)).toBe(false);
  });

  it('escribir sobre la ilusión la hace desaparecer', () => {
    const p = pelea();
    const [vision] = avanzar(p, 15).filter((e) => e.tipo === 'vision');
    p.colocar(vision.indice, SOLUCION[vision.indice]);
    expect(p.disfraz().valores.has(vision.indice)).toBe(false);
  });

  it('el aullido petrifica un dígito que falta a los 20 s, y se libera después', () => {
    const p = pelea();
    const amenazado = p.aullido.digito;
    expect(p.digitoCompleto(amenazado)).toBe(false);

    const eventos = avanzar(p, 20);
    expect(eventos).toContainEqual({ tipo: 'petrifica', digito: amenazado });
    const celdaDondeVa = [0, 1, 2, 9, 10, 11, 18, 19, 20, 40].find((i) => SOLUCION[i] === amenazado);
    expect(p.colocar(celdaDondeVa, amenazado)).toBe(false);

    expect(avanzar(p, 5)).toContainEqual({ tipo: 'libera', digito: amenazado });
    expect(p.colocar(celdaDondeVa, amenazado)).toBe(true);
  });

  it('pasa a fase 2 al quedar 1 minuto, y ahí empieza a maldecir', () => {
    const p = pelea();
    p.colocar(0, SOLUCION[0]);
    p.restantes = 61;
    expect(p.fase).toBe(1);
    avanzar(p, 1);
    expect(p.fase).toBe(2);

    const maldiciones = avanzar(p, 10).filter((e) => e.tipo === 'maldicion');
    expect(maldiciones).toHaveLength(1);
    expect(maldiciones[0].falso).not.toBe(maldiciones[0].real);
  });

  it('la uber no permite notas', () => {
    const uber = new PeleaHecate({ tableroInicial: vaciar([0]), solucion: SOLUCION, uber: true });
    expect(uber.alternarNota(0, 5)).toBe(false);
  });
});

describe('PeleaJormungandr', () => {
  const VACIAS = [0, 1, 2, 9, 10, 11, 18, 19, 20, 40, 41, 42];
  function pelea(uber = false) {
    return new PeleaJormungandr({ tableroInicial: vaciar(VACIAS), solucion: SOLUCION, uber });
  }

  it('Hambre devora un número del jugador cada 60 s y llena el vientre', () => {
    const p = pelea();
    p.colocar(0, SOLUCION[0]);
    for (let s = 0; s < 59; s++) expect(p.avanzarUnSegundo()).toBeNull();

    const { tecnica, bocados } = p.avanzarUnSegundo();
    expect(tecnica).toBe('hambre');
    expect(bocados).toEqual([{ indice: 0, valor: SOLUCION[0], pista: false }]);
    expect(p.tablero[0]).toBe(0);
    expect(p.vientre).toBe(1);
  });

  it('llenar una celda baja el vientre una sola vez por celda', () => {
    const p = pelea();
    p.vientre = 5;
    p.colocar(0, SOLUCION[0]);
    expect(p.vientre).toBe(4);
    p.borrar(0);
    expect(p.vientre).toBe(5); // borrar devuelve el alivio
    p.colocar(0, SOLUCION[0]);
    expect(p.vientre).toBe(4);
  });

  it('con 10 en el vientre pasa a Glotonería y devora pistas, que dejan de ser fijas', () => {
    const p = pelea();
    p.cambiarVientre(10);
    expect(p.fase).toBe(2);
    const { tecnica, bocados } = p.comer();
    expect(tecnica).toBe('glotoneria');
    expect(bocados[0].pista).toBe(true);
    expect(p.esFija(bocados[0].indice)).toBe(false);
    expect(p.alcanzoFase2).toBe(true);
  });

  it('el vientre puede bajar y volver a fase 1', () => {
    const p = pelea();
    p.cambiarVientre(10);
    p.colocar(0, SOLUCION[0]);
    expect(p.fase).toBe(1);
  });

  it('el secreto: darle de comer una pista cuenta doble', () => {
    const p = pelea();
    const pista = 3; // la celda 3 es una pista
    expect(p.alimentar(pista)).toMatchObject({ pista: true });
    expect(p.vientre).toBe(2);
  });

  it('la uber come más de golpe', () => {
    const p = pelea(true);
    p.colocar(0, SOLUCION[0]);
    p.colocar(1, SOLUCION[1]);
    p.esperaComer = 1;
    expect(p.avanzarUnSegundo().bocados).toHaveLength(2);
  });
});
