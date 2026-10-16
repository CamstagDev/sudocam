// El tablero de un duelo visto desde un teléfono: el propio jugador
// ('yo') contra el otro ('rival').
//
// Usa las reglas de las peleas de jefe (ver partida-de-jefe.js): en rojo
// solo los repetidos y cada número equivocado cuenta como error. Una
// casilla anotada, por cualquiera de los dos, queda fija: no se puede
// borrar ni cambiar.
//
// Quién se anota cada casilla lo decide el árbitro del anfitrión (ver
// sesion.js). Mientras su decisión viaja, el jugador ve su número correcto
// como suyo; si el rival había llegado antes, `anotarCasilla` lo corrige.

import { PartidaDeJefe } from '../jefes/partida-de-jefe.js';

export class PartidaDuelo extends PartidaDeJefe {
  constructor({ dificultad, tableroInicial, solucion }) {
    super({ dificultad, tableroInicial, solucion });
    this.casillasALlenar = tableroInicial.filter((valor) => valor === 0).length;
    this.duenos = new Array(tableroInicial.length).fill(null); // 'yo' | 'rival' | null
  }

  esFija(indice) {
    return super.esFija(indice) || Boolean(this.duenos?.[indice]);
  }

  // Un número del jugador. Si es el correcto, la casilla pasa a ser suya
  // (hasta que el árbitro diga otra cosa).
  colocar(indice, valor) {
    if (!super.colocar(indice, valor)) return false;
    if (valor === this.solucion[indice]) this.duenos[indice] = 'yo';
    return true;
  }

  // La decisión del árbitro sobre una casilla: manda sobre lo que haya.
  anotarCasilla(indice, valor, dueno) {
    this.tablero[indice] = valor;
    this.duenos[indice] = dueno;
    this.notas[indice].clear();
    this.actualizarErroresVisibles();
  }

  celdasDe(dueno) {
    return new Set(this.duenos.flatMap((d, indice) => (d === dueno ? [indice] : [])));
  }

  get puntos() {
    return { yo: this.celdasDe('yo').size, rival: this.celdasDe('rival').size };
  }
}
