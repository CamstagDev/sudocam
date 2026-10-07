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
import { PeleaBabel } from '../src/game/jefes/babel.js';
import { CONFIGURACION, PeleaTyphon } from '../src/game/jefes/typhon.js';
import { generarMultiSudoku } from '../src/game/multisudoku/generador.js';
import { JEFES, SECCIONES_INFORMACION } from '../src/game/jefes/catalogo.js';
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

  it('pasa a fase 2 al llenar el 25 %, o con el truco del retrato', () => {
    const p = pelea([0, 1, 2, 9, 10, 11, 18, 19]);
    p.colocar(0, 5);
    expect(p.fase).toBe(1); // 1 de 8
    p.colocar(1, 1); // equivocado, pero "llenada" igual
    expect(p.fase).toBe(2); // 2 de 8

    const otra = pelea();
    otra.faseForzada = true;
    expect(otra.fase).toBe(2);
  });

  it('la búsqueda fácil toca cada 10 s y la de descarte cada 20 s, solo en fase 2', () => {
    const p = pelea();
    const disparos = [];
    for (let s = 1; s <= 20; s++) disparos.push(...p.avanzarUnSegundo());
    expect(disparos).toEqual(['facil', 'facil']);

    p.faseForzada = true;
    const enFase2 = [];
    for (let s = 1; s <= 20; s++) enFase2.push(...p.avanzarUnSegundo());
    expect(enFase2).toEqual(['facil', 'facil', 'descarte']);
  });

  it('Uber Uriel busca más seguido: la fácil cada 5 s y la de descarte cada 15 s', () => {
    const uber = new PeleaUriel({ tableroInicial: vaciar([0, 1, 2, 9, 10]), solucion: SOLUCION, uber: true });
    uber.faseForzada = true;
    const disparos = [];
    for (let s = 1; s <= 15; s++) disparos.push(...uber.avanzarUnSegundo());
    expect(disparos).toEqual(['facil', 'facil', 'facil', 'descarte']);
  });

  it('la pasiva usa las dos búsquedas, también en fase 1', () => {
    // En la caja 0 de este tablero la búsqueda fácil no ve nada, pero la de
    // descarte sí: el 8 solo cabe en la celda 20.
    const vacias = [1, 3, 4, 5, 6, 8, 10, 11, 13, 20, 21, 22, 23, 24, 26, 28, 30, 32, 33, 35, 36, 37, 41,
      43, 47, 48, 49, 51, 55, 56, 57, 59, 62, 68, 69, 72, 73, 74, 77, 80];
    const p = pelea(vacias);
    expect(p.fase).toBe(1);
    expect(p.buscarJugada('facil', CAJAS[0])).toBeNull();
    expect(p.buscarJugada('pasiva', CAJAS[0])).toEqual({ indice: 20, valor: 8 });
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

  it('la pasiva de Uriel se ve con la primera victoria y no endurece el desbloqueo de la uber', async () => {
    await registrarVictoriaDeJefe('uriel', { segundos: 400, errores: 3, usoNotas: true, puntosJefe: 2 });
    expect(JEFES.uriel.pasiva.seDesbloqueaCon(estadisticasDeJefe('uriel'))).toBe(true);
    expect(estaCompletamenteInvestigado('uriel')).toBe(false); // faltan 3x3x3 y el secreto
  });

  it('investigar a Hecate pide lo mismo de siempre: ganar en 10:00 o menos y sin errores', async () => {
    await registrarVictoriaDeJefe('hecate', { segundos: 700, errores: 0, usoNotas: false });
    expect(estaCompletamenteInvestigado('hecate')).toBe(false); // falta ganar en 10:00
    await registrarVictoriaDeJefe('hecate', { segundos: 500, errores: 2, usoNotas: false });
    expect(estaCompletamenteInvestigado('hecate')).toBe(true);
  });

  it('investigar a Jörmungandr pide lo mismo de siempre: ganar en 15:00 o menos y 3 victorias', async () => {
    await registrarVictoriaDeJefe('jormungandr', { segundos: 800, errores: 1, usoNotas: false });
    await registrarVictoriaDeJefe('jormungandr', { segundos: 1000, errores: 1, usoNotas: false });
    expect(estaCompletamenteInvestigado('jormungandr')).toBe(false); // faltan 3 victorias
    await registrarVictoriaDeJefe('jormungandr', { segundos: 1000, errores: 1, usoNotas: false });
    expect(estaCompletamenteInvestigado('jormungandr')).toBe(true);
  });

  it('investigar a Typhon pide lo mismo de siempre: ganar en 30:00 o menos y sin errores', async () => {
    await registrarVictoriaDeJefe('typhon', { segundos: 2000, errores: 0, usoNotas: false });
    expect(estaCompletamenteInvestigado('typhon')).toBe(false); // falta ganar en 30:00
    await registrarVictoriaDeJefe('typhon', { segundos: 1500, errores: 3, usoNotas: false });
    expect(estaCompletamenteInvestigado('typhon')).toBe(true);
  });

  it('cada habilidad con dibujo tiene también nombre y emoji de respaldo', () => {
    for (const jefe of Object.values(JEFES)) {
      for (const seccion of SECCIONES_INFORMACION.map((nombre) => jefe[nombre]).filter(Boolean)) {
        if (seccion.imagen) expect(seccion).toMatchObject({ titulo: expect.any(String), emoji: expect.any(String) });
      }
    }
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

describe('PeleaBabel', () => {
  // Caja 0 con sus 9 celdas vacías y otra celda suelta en la caja 4.
  const VACIAS = [0, 1, 2, 9, 10, 11, 18, 19, 20, 40];
  function pelea(uber = false) {
    return new PeleaBabel({ tableroInicial: vaciar(VACIAS), solucion: SOLUCION, dificultad: 'medio', uber });
  }

  it('cada dígito tiene su propio símbolo y el teclado no va en orden de 1 a 9 fijo', () => {
    const p = pelea();
    const simbolos = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => p.simboloDe(0, d)));
    expect(simbolos.size).toBe(9);
    expect(p.filasDelTeclado()).toHaveLength(1);
    expect(p.filasDelTeclado()[0].map((tecla) => tecla.digito).sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('completar una caja hace evolucionar la lengua (una sola vez por caja)', () => {
    const p = pelea();
    const antes = p.simboloDe(0, 5);
    [0, 1, 2, 9, 10, 11, 18, 19].forEach((i) => p.colocar(i, SOLUCION[i]));
    expect(p.evoluciones).toBe(0);
    p.colocar(20, SOLUCION[20]);
    expect(p.evoluciones).toBe(1);

    p.borrar(20);
    p.colocar(20, SOLUCION[20]);
    expect(p.evoluciones).toBe(1);
    expect(antes).toBeDefined();
  });

  it('la uber tiene 3 alfabetos sin símbolos repetidos y no permite notas', () => {
    const p = pelea(true);
    expect(p.filasDelTeclado()).toHaveLength(3);
    const todos = p.filasDelTeclado().flat().map((tecla) => tecla.texto);
    expect(new Set(todos).size).toBe(27);
    expect(p.alternarNota(0, 1)).toBe(false);
  });
});

describe('PeleaTyphon', () => {
  function pelea(uber = false) {
    const { cantidad, pistasPorGrilla } = uber ? CONFIGURACION.uber : CONFIGURACION.normal;
    const { puzzle, solucion } = generarMultiSudoku({ cantidad, pistasPorGrilla });
    return new PeleaTyphon({ tableroInicial: puzzle, solucion, uber });
  }

  it('girar cuatro veces deja todo como estaba, y cada giro mueve números y solución juntos', () => {
    const p = pelea();
    const vacia = p.lienzo.celdas.find((i) => p.tablero[i] === 0);
    p.colocar(vacia, p.solucion[vacia]);
    const antes = JSON.stringify([p.tablero, p.solucion, p.tableroInicial]);

    p.girar('derecha');
    expect(p.tablero[p.indiceGirado(vacia, 'derecha')]).toBe(p.solucion[p.indiceGirado(vacia, 'derecha')]);
    p.girar('derecha');
    p.girar('derecha');
    p.girar('derecha');
    expect(JSON.stringify([p.tablero, p.solucion, p.tableroInicial])).toBe(antes);

    p.girar('izquierda');
    p.girar('derecha');
    expect(JSON.stringify([p.tablero, p.solucion, p.tableroInicial])).toBe(antes);
  });

  it('girar no saca a ninguna celda de la forma', () => {
    const p = pelea();
    const activas = new Set(p.lienzo.celdas);
    expect(p.lienzo.celdas.every((i) => activas.has(p.indiceGirado(i, 'derecha')))).toBe(true);
  });

  it('si hay giros de los dos lados, se turnan', () => {
    const p = pelea();
    p.girosPendientes = { derecha: 2, izquierda: 1 };
    expect([p.siguienteGiro(), p.siguienteGiro(), p.siguienteGiro(), p.siguienteGiro()])
      .toEqual(['derecha', 'izquierda', 'derecha', null]);
  });

  it('uber: la caja que pulsa y no se salva regenera su tablero, sin tocar el del medio', () => {
    const p = pelea(true);
    p.esperaPadre = 1;
    expect(p.avanzarUnSegundo().map((e) => e.tipo)).toContain('pulso');
    const caja = p.pulso.caja;
    const centro = p.lienzo.celdas.filter((i) => p.lienzo.ubicaciones[i].some((l) => l.grilla === 2));
    const centroAntes = centro.map((i) => p.solucion[i]);

    let eventos = [];
    for (let s = 0; s < 10; s++) eventos.push(...p.avanzarUnSegundo().map((e) => e.tipo));
    expect(eventos).toContain('regenera');
    expect(centro.map((i) => p.solucion[i])).toEqual(centroAntes);
    expect(caja.some((i) => p.tablero[i] === 0) || caja.every((i) => p.esFija(i))).toBe(true);
  });

  it('uber: escribir un número correcto en la caja que pulsa la salva', () => {
    const p = pelea(true);
    p.esperaPadre = 1;
    p.avanzarUnSegundo();
    const vacia = p.pulso.caja.find((i) => p.tablero[i] === 0);
    p.colocar(vacia, p.solucion[vacia]);
    expect(p.pulso).toBeNull();
    expect(p.avanzarUnSegundo().map((e) => e.tipo)).toContain('salvada');
  });
});
