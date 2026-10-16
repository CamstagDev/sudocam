import { describe, expect, it } from 'vitest';
import { Arbitro } from '../src/game/duelo/arbitro.js';
import { crearSesionDuelo } from '../src/game/duelo/sesion.js';
import { crearParDeConexiones } from '../src/game/duelo/transportes/memoria.js';
import { VERSION_PROTOCOLO } from '../src/game/duelo/reglas.js';
import { textoATablero } from '../src/game/sudoku/tablero.js';

// Un sudoku fijo con 3 casillas vacías: 0, 1 y 2 (valen 5, 3 y 4).
const SOLUCION = textoATablero('534678912672195348198342567859761423426853791713924856961537284287419635345286179');
const PUZZLE = SOLUCION.map((valor, indice) => (indice < 3 ? 0 : valor));
const generarFijo = () => ({ puzzle: [...PUZZLE], solucion: [...SOLUCION] });

// Deja pasar los mensajes en vuelo (llegan "un instante" después) y las
// respuestas que provocan.
async function esperarMensajes() {
  for (let i = 0; i < 5; i++) await new Promise((resolver) => setTimeout(resolver, 0));
}

// Un duelo entre dos sesiones conectadas en memoria, con lo que cada
// una fue recibiendo.
async function crearDuelo() {
  const [conexionA, conexionB] = crearParDeConexiones();
  const eventos = { anfitrion: [], invitado: [] };
  const opciones = (rol) => ({
    rol,
    generar: generarFijo,
    alEmpezar: () => eventos[rol].push('empezar'),
    alCambiar: () => eventos[rol].push('cambio'),
    alTerminar: (fin) => eventos[rol].push(fin),
    alRivalPideRevancha: () => eventos[rol].push('rival pide revancha'),
    alRivalSeFue: () => eventos[rol].push('rival se fue'),
  });
  const anfitrion = crearSesionDuelo({ conexion: conexionA, ...opciones('anfitrion') });
  const invitado = crearSesionDuelo({ conexion: conexionB, ...opciones('invitado') });
  await esperarMensajes();
  return { anfitrion, invitado, eventos };
}

// Lo que hace la pantalla cuando el jugador escribe un número.
function jugar(sesion, indice, valor) {
  sesion.partida.colocar(indice, valor);
  if (valor === sesion.partida.solucion[indice]) sesion.reclamar(indice, valor);
}

describe('árbitro', () => {
  it('cada casilla es de quien la pide primero con el número correcto', () => {
    const arbitro = new Arbitro({ tableroInicial: PUZZLE, solucion: SOLUCION });
    expect(arbitro.reclamar('invitado', 0, 9)).toBe(false); // número equivocado
    expect(arbitro.reclamar('invitado', 0, 5)).toBe(true);
    expect(arbitro.reclamar('anfitrion', 0, 5)).toBe(false); // llegó tarde
    expect(arbitro.reclamar('anfitrion', 10, SOLUCION[10])).toBe(false); // era una pista
    expect(arbitro.puntos).toEqual({ anfitrion: 0, invitado: 1 });
    expect(arbitro.completo).toBe(false);
  });
});

describe('sesión de duelo', () => {
  it('el anfitrión manda el mismo sudoku y los dos empiezan', async () => {
    const { anfitrion, invitado, eventos } = await crearDuelo();
    expect(eventos.anfitrion).toEqual(['empezar']);
    expect(eventos.invitado).toEqual(['empezar']);
    expect(invitado.partida.tablero).toEqual(anfitrion.partida.tablero);
    expect(invitado.partida.solucion).toEqual(SOLUCION);
  });

  it('lo que se anota uno lo ve el otro como del rival', async () => {
    const { anfitrion, invitado } = await crearDuelo();
    jugar(invitado, 0, 5);
    jugar(anfitrion, 1, 3);
    await esperarMensajes();

    expect(anfitrion.partida.duenos.slice(0, 2)).toEqual(['rival', 'yo']);
    expect(invitado.partida.duenos.slice(0, 2)).toEqual(['yo', 'rival']);
    expect(invitado.partida.tablero[1]).toBe(3);
  });

  it('si los dos piden la misma casilla, gana quien llegó primero al árbitro', async () => {
    const { anfitrion, invitado } = await crearDuelo();
    // El anfitrión juega en su teléfono antes de que llegue el pedido del
    // invitado, que mientras tanto la cree suya.
    jugar(invitado, 0, 5);
    jugar(anfitrion, 0, 5);
    expect(invitado.partida.duenos[0]).toBe('yo');
    await esperarMensajes();

    expect(anfitrion.partida.duenos[0]).toBe('yo');
    expect(invitado.partida.duenos[0]).toBe('rival'); // el árbitro lo corrigió
  });

  it('un número equivocado cuenta como error y no se anota', async () => {
    const { anfitrion, invitado } = await crearDuelo();
    jugar(invitado, 0, 9);
    await esperarMensajes();
    expect(invitado.partida.errores).toBe(1);
    expect(invitado.partida.duenos[0]).toBeNull();
    expect(anfitrion.partida.duenos[0]).toBeNull();
  });

  it('al llenarse el tablero, los dos ven el mismo resultado', async () => {
    const { anfitrion, invitado, eventos } = await crearDuelo();
    jugar(invitado, 0, 5);
    jugar(invitado, 1, 3);
    await esperarMensajes();
    jugar(anfitrion, 2, 4);
    await esperarMensajes();

    expect(eventos.anfitrion.at(-1)).toEqual({ motivo: 'completo', puntos: { yo: 1, rival: 2 } });
    expect(eventos.invitado.at(-1)).toEqual({ motivo: 'completo', puntos: { yo: 2, rival: 1 } });
  });

  it('si uno se rinde, el otro se entera', async () => {
    const { anfitrion, eventos } = await crearDuelo();
    anfitrion.abandonar();
    await esperarMensajes();
    expect(eventos.invitado.at(-1).motivo).toBe('rendicion');
    expect(eventos.anfitrion).toEqual(['empezar']); // quien se rinde no recibe nada más
  });

  it('si se corta la conexión, termina por desconexión', async () => {
    const [conexionA, conexionB] = crearParDeConexiones();
    let fin = null;
    crearSesionDuelo({ conexion: conexionA, rol: 'anfitrion', generar: generarFijo, alTerminar: (f) => { fin = f; } });
    await esperarMensajes();
    conexionB.cerrar();
    await esperarMensajes();
    expect(fin.motivo).toBe('desconexion');
  });

  it('dos versiones distintas del juego no se enfrentan', async () => {
    const [conexionA, conexionB] = crearParDeConexiones();
    const fines = [];
    crearSesionDuelo({ conexion: conexionA, rol: 'anfitrion', generar: generarFijo, alTerminar: (f) => fines.push(f.motivo) });
    conexionB.alRecibir((mensaje) => fines.push(`invitado: ${mensaje.motivo}`));
    conexionB.enviar({ tipo: 'hola', version: VERSION_PROTOCOLO + 1 });
    await esperarMensajes();
    expect(fines).toEqual(['version', 'invitado: version']);
  });

  describe('revancha', () => {
    // Una ronda completa: el invitado se anota todo.
    async function jugarRonda({ invitado }) {
      for (const [indice, valor] of [[0, 5], [1, 3], [2, 4]]) jugar(invitado, indice, valor);
      await esperarMensajes();
    }

    it('cuando los dos la piden, empieza otra ronda sobre la misma conexión', async () => {
      const duelo = await crearDuelo();
      const { anfitrion, invitado, eventos } = duelo;
      await jugarRonda(duelo);
      const primerSudoku = invitado.partida;

      invitado.pedirRevancha();
      await esperarMensajes();
      expect(eventos.anfitrion.at(-1)).toBe('rival pide revancha');
      expect(invitado.partida).toBe(primerSudoku); // falta que el anfitrión acepte

      anfitrion.pedirRevancha();
      await esperarMensajes();
      expect(eventos.anfitrion.at(-1)).toBe('empezar');
      expect(eventos.invitado.at(-1)).toBe('empezar');
      expect(invitado.partida).not.toBe(primerSudoku);
      expect(invitado.partida.puntos).toEqual({ yo: 0, rival: 0 });

      // Y la ronda nueva se juega igual.
      await jugarRonda(duelo);
      expect(eventos.anfitrion.at(-1)).toEqual({ motivo: 'completo', puntos: { yo: 0, rival: 3 } });
    });

    it('si los dos la piden a la vez, empieza una sola ronda', async () => {
      const duelo = await crearDuelo();
      await jugarRonda(duelo);
      duelo.anfitrion.pedirRevancha();
      duelo.invitado.pedirRevancha();
      await esperarMensajes();
      const rondas = (rol) => duelo.eventos[rol].filter((e) => e === 'empezar').length;
      expect([rondas('anfitrion'), rondas('invitado')]).toEqual([2, 2]);
    });

    it('si el rival se va entre rondas, ya no hay revancha', async () => {
      const duelo = await crearDuelo();
      await jugarRonda(duelo);
      duelo.anfitrion.abandonar();
      await esperarMensajes();
      expect(duelo.eventos.invitado.at(-1)).toBe('rival se fue');

      duelo.invitado.pedirRevancha();
      await esperarMensajes();
      expect(duelo.eventos.invitado.filter((e) => e === 'empezar')).toHaveLength(1);
    });

    it('a mitad de una ronda no se puede pedir', async () => {
      const { invitado, eventos } = await crearDuelo();
      invitado.pedirRevancha();
      await esperarMensajes();
      expect(eventos.anfitrion).not.toContain('rival pide revancha');
    });
  });
});
