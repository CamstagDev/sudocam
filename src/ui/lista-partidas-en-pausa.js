// Tarjeta "Partidas guardadas" del menú: lista las partidas de sudoku en
// pausa con sus botones Continuar y Eliminar.
//
//   dibujarPartidasEnPausa(contenedor);

import { navegar } from '../router.js';
import { DIFICULTADES } from '../game/sudoku/dificultades.js';
import {
  MAXIMO_PARTIDAS_EN_PAUSA,
  eliminarPartidaEnPausa,
  listarPartidasEnPausa,
} from '../game/sudoku/partidas-en-pausa.js';
import { TOTAL_CELDAS } from '../game/sudoku/tablero.js';
import { formatearSegundos } from './cronometro.js';
import { confirmar } from './modal.js';

function formatearFecha(iso) {
  return new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function celdasLlenas(tableroTexto) {
  return [...tableroTexto].filter((digito) => digito !== '0').length;
}

function filaPartida(guardada) {
  const fila = document.createElement('div');
  fila.className = 'fila-lista';
  fila.innerHTML = `
    <div>
      <span class="fila-lista-nombre">${DIFICULTADES[guardada.dificultad]?.nombre ?? guardada.dificultad}</span>
      <p class="fila-lista-detalle">
        ${celdasLlenas(guardada.tableroActual)}/${TOTAL_CELDAS} celdas ·
        ${formatearSegundos(guardada.segundos)} ·
        ${formatearFecha(guardada.actualizada)}
      </p>
    </div>
    <div class="fila-lista-acciones">
      <button type="button" class="btn btn-secondary btn-sm" data-accion="continuar">Continuar</button>
      <button type="button" class="btn btn-peligro btn-sm" data-accion="eliminar">Eliminar</button>
    </div>
  `;
  return fila;
}

export function dibujarPartidasEnPausa(contenedor) {
  const partidas = listarPartidasEnPausa();
  contenedor.replaceChildren();

  if (partidas.length === 0) {
    contenedor.innerHTML = '<div class="empty-state">Todavía no tienes partidas en pausa.</div>';
    return;
  }

  for (const guardada of partidas) {
    const fila = filaPartida(guardada);

    fila.querySelector('[data-accion="continuar"]').addEventListener('click', () => {
      navegar('sudoku', { partida: guardada.id });
    });

    fila.querySelector('[data-accion="eliminar"]').addEventListener('click', async () => {
      const seguro = await confirmar({
        titulo: 'Eliminar partida',
        mensaje: 'Esta partida en pausa se perderá. ¿Seguro?',
        textoConfirmar: 'Eliminar',
        peligroso: true,
      });
      if (!seguro) return;
      await eliminarPartidaEnPausa(guardada.id);
      dibujarPartidasEnPausa(contenedor);
    });

    contenedor.appendChild(fila);
  }
}

export const TEXTO_LIMITE_PARTIDAS = `Puedes tener hasta ${MAXIMO_PARTIDAS_EN_PAUSA} partidas de sudoku en pausa a la vez.`;
