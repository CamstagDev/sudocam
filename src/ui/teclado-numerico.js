// Botones 1-9, "Borrar" y "Notas" debajo del tablero.
//
//   const teclado = crearTecladoNumerico(contenedor, { alElegirDigito, alBorrar, alAlternarNotas });
//   teclado.dibujar({ digitosCompletos: Set, modoNotas: boolean, bloqueados: Set, cargando: Map });
//   teclado.rearmar(filas);
//
// `bloqueados` (Hecate) deshabilita esos dígitos; `cargando` muestra un
// relleno que sube por el botón (Map dígito -> 0 a 1).
//
// `filas` cambia qué botones hay y qué dicen (Babel usa símbolos y las
// desordena): un arreglo de filas, cada una con { digito, texto, alfabeto? }.
// Por defecto es una sola fila del 1 al 9.

import { DIGITOS } from '../game/sudoku/tablero.js';

const FILAS_NORMALES = [DIGITOS.map((digito) => ({ digito, texto: String(digito) }))];

function botonDeDigito({ digito, texto, alfabeto }) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'tecla';
  boton.dataset.digito = String(digito);
  if (alfabeto !== undefined) boton.dataset.alfabeto = String(alfabeto);
  boton.innerHTML = '<span class="tecla-relleno"></span><span class="tecla-numero"></span>';
  boton.querySelector('.tecla-numero').textContent = texto;
  return boton;
}

export function crearTecladoNumerico(contenedor, { alElegirDigito, alBorrar, alAlternarNotas }) {
  const teclado = document.createElement('div');
  teclado.className = 'teclado';
  teclado.innerHTML = `
    <div class="teclado-digitos"></div>
    <div class="teclado-acciones">
      <button type="button" class="chip" id="tecla-notas" title="Anotar candidatos en vez de escribir el número (atajo: N)">✏️ Notas</button>
      <button type="button" class="chip" id="tecla-borrar" title="Borrar la celda (atajo: Retroceso)">⌫ Borrar</button>
    </div>
  `;
  contenedor.appendChild(teclado);
  const digitosEl = teclado.querySelector('.teclado-digitos');

  teclado.querySelector('#tecla-borrar').addEventListener('click', alBorrar);
  // Sin `alAlternarNotas` (jefes uber) no hay botón de notas.
  if (alAlternarNotas) teclado.querySelector('#tecla-notas').addEventListener('click', alAlternarNotas);
  else teclado.querySelector('#tecla-notas').remove();

  function rearmar(filas) {
    digitosEl.replaceChildren(...filas.flat().map((tecla) => {
      const boton = botonDeDigito(tecla);
      boton.addEventListener('click', () => alElegirDigito(tecla.digito));
      return boton;
    }));
  }

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

  rearmar(FILAS_NORMALES);
  return { dibujar, rearmar };
}
