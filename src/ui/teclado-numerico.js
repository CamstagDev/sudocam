// Botones 1-9, "Borrar" y "Notas" debajo del tablero.
//
//   const teclado = crearTecladoNumerico(contenedor, { alElegirDigito, alBorrar, alAlternarNotas });
//   teclado.dibujar({ digitosCompletos: Set, modoNotas: boolean });

import { DIGITOS } from '../game/sudoku/tablero.js';

export function crearTecladoNumerico(contenedor, { alElegirDigito, alBorrar, alAlternarNotas }) {
  const teclado = document.createElement('div');
  teclado.className = 'teclado';
  teclado.innerHTML = `
    <div class="teclado-digitos">
      ${DIGITOS.map((digito) => `<button type="button" class="tecla" data-digito="${digito}">${digito}</button>`).join('')}
    </div>
    <div class="teclado-acciones">
      <button type="button" class="chip" id="tecla-notas" title="Anotar candidatos en vez de escribir el número (atajo: N)">✏️ Notas</button>
      <button type="button" class="chip" id="tecla-borrar" title="Borrar la celda (atajo: Retroceso)">⌫ Borrar</button>
    </div>
  `;
  contenedor.appendChild(teclado);

  teclado.querySelectorAll('[data-digito]').forEach((boton) => {
    boton.addEventListener('click', () => alElegirDigito(Number(boton.dataset.digito)));
  });
  teclado.querySelector('#tecla-borrar').addEventListener('click', alBorrar);
  teclado.querySelector('#tecla-notas').addEventListener('click', alAlternarNotas);

  function dibujar({ digitosCompletos, modoNotas }) {
    teclado.querySelectorAll('[data-digito]').forEach((boton) => {
      boton.classList.toggle('completo', digitosCompletos.has(Number(boton.dataset.digito)));
    });
    teclado.querySelector('#tecla-notas').classList.toggle('activo', modoNotas);
  }

  return { dibujar };
}
