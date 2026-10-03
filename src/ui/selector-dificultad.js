// Modal "Nuevo Sudoku": el jugador elige la dificultad y, si es
// personalizada, la política de errores y cuántos números empiezan
// puestos.
//
//   const eleccion = await elegirDificultadSudoku();
//   // null si cerró el modal, o { dificultad, pistas?, politicaErrores? }

import { abrirModal } from './modal.js';
import {
  DIFICULTADES,
  PISTAS_PERSONALIZADO_MAX,
  PISTAS_PERSONALIZADO_MIN,
  POLITICAS_ERRORES,
} from '../game/sudoku/dificultades.js';

function opcionDificultad(id, { nombre, descripcion }) {
  return `
    <button type="button" class="opcion-fila" data-dificultad="${id}">
      <span class="opcion-fila-titulo">${nombre}</span>
      <span class="opcion-fila-desc">${descripcion}</span>
    </button>
  `;
}

function chipPolitica(id, nombre) {
  return `<button type="button" class="chip" data-politica="${id}">${nombre}</button>`;
}

export function elegirDificultadSudoku() {
  return new Promise((resolver) => {
    const contenido = document.createElement('div');
    contenido.innerHTML = `
      <div class="paso-dificultad">
        <div class="opcion-picker">
          ${Object.entries(DIFICULTADES).map(([id, datos]) => opcionDificultad(id, datos)).join('')}
        </div>
      </div>

      <div class="paso-personalizado hidden">
        <div class="campo">
          <span class="campo-etiqueta">¿Cuándo mostrar los errores?</span>
          <div class="chip-picker">
            ${Object.entries(POLITICAS_ERRORES).map(([id, nombre]) => chipPolitica(id, nombre)).join('')}
          </div>
        </div>

        <div class="campo">
          <label class="campo-etiqueta" for="pistas-input">Números al empezar: <strong id="pistas-valor"></strong></label>
          <input type="range" id="pistas-input" min="${PISTAS_PERSONALIZADO_MIN}" max="${PISTAS_PERSONALIZADO_MAX}" />
          <p class="campo-ayuda">Menos números = más difícil (mínimo ${PISTAS_PERSONALIZADO_MIN}, máximo ${PISTAS_PERSONALIZADO_MAX}).</p>
        </div>

        <div class="fila-acciones">
          <button type="button" class="btn btn-secondary" id="btn-atras">Atrás</button>
          <button type="button" class="btn btn-primary" id="btn-comenzar">Comenzar</button>
        </div>
      </div>
    `;

    let eleccion = null;
    const modal = abrirModal({
      titulo: 'Nuevo Sudoku',
      contenido,
      alCerrar: () => resolver(eleccion),
    });

    const pasoDificultad = contenido.querySelector('.paso-dificultad');
    const pasoPersonalizado = contenido.querySelector('.paso-personalizado');
    const pistasInput = contenido.querySelector('#pistas-input');
    const pistasValor = contenido.querySelector('#pistas-valor');
    let politicaElegida = DIFICULTADES.personalizado.politicaErrores;

    function marcarPolitica(id) {
      politicaElegida = id;
      contenido.querySelectorAll('[data-politica]').forEach((chip) => {
        chip.classList.toggle('activo', chip.dataset.politica === id);
      });
    }

    function mostrarPaso(personalizado) {
      pasoDificultad.classList.toggle('hidden', personalizado);
      pasoPersonalizado.classList.toggle('hidden', !personalizado);
    }

    function terminar(resultado) {
      eleccion = resultado;
      modal.cerrar();
    }

    // Las dificultades con nombre empiezan de una; "personalizado" pasa al
    // segundo paso para elegir sus opciones.
    contenido.querySelectorAll('[data-dificultad]').forEach((boton) => {
      boton.addEventListener('click', () => {
        const dificultad = boton.dataset.dificultad;
        if (dificultad === 'personalizado') mostrarPaso(true);
        else terminar({ dificultad });
      });
    });

    contenido.querySelectorAll('[data-politica]').forEach((chip) => {
      chip.addEventListener('click', () => marcarPolitica(chip.dataset.politica));
    });

    pistasInput.value = String(DIFICULTADES.personalizado.pistas);
    pistasValor.textContent = pistasInput.value;
    pistasInput.addEventListener('input', () => {
      pistasValor.textContent = pistasInput.value;
    });

    contenido.querySelector('#btn-atras').addEventListener('click', () => mostrarPaso(false));
    contenido.querySelector('#btn-comenzar').addEventListener('click', () => {
      terminar({
        dificultad: 'personalizado',
        pistas: Number(pistasInput.value),
        politicaErrores: politicaElegida,
      });
    });

    marcarPolitica(politicaElegida);
  });
}
