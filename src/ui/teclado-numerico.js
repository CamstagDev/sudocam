// Botones 1-9, "Borrar" y "Notas" debajo del tablero.
//
//   const teclado = crearTecladoNumerico(contenedor, { alElegirDigito, alBorrar, alAlternarNotas });
//   teclado.dibujar({ digitosCompletos: Set, modoNotas: boolean, bloqueados: Set, cargando: Map });
//
// `bloqueados` (Hecate) deshabilita esos dígitos; `cargando` muestra un
// relleno que sube por el botón (Map dígito -> 0 a 1).

import { DIGITOS } from '../game/sudoku/tablero.js';

export function crearTecladoNumerico(contenedor, { alElegirDigito, alBorrar, alAlternarNotas }) {
  const teclado = document.createElement('div');
  teclado.className = 'teclado';
  teclado.innerHTML = `
    <div class="teclado-digitos">
      ${DIGITOS.map((digito) => `
        <button type="button" class="tecla" data-digito="${digito}">
          <span class="tecla-relleno"></span><span class="tecla-numero">${digito}</span>
        </button>`).join('')}
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
  // Sin `alAlternarNotas` (jefes uber) no hay botón de notas.
  if (alAlternarNotas) teclado.querySelector('#tecla-notas').addEventListener('click', alAlternarNotas);
  else teclado.querySelector('#tecla-notas').remove();

  function dibujar({ digitosCompletos, modoNotas, bloqueados = new Set(), cargando = new Map() }) {
    teclado.querySelectorAll('[data-digito]').forEach((boton) => {
      const digito = Number(boton.dataset.digito);
      boton.classList.toggle('completo', digitosCompletos.has(digito));
      boton.classList.toggle('bloqueado', bloqueados.has(digito));
      boton.classList.toggle('cargando', cargando.has(digito));
      boton.disabled = bloqueados.has(digito);
      boton.querySelector('.tecla-relleno').style.height = `${(cargando.get(digito) ?? 0) * 100}%`;
    });
    teclado.querySelector('#tecla-notas')?.classList.toggle('activo', modoNotas);
  }

  return { dibujar };
}
