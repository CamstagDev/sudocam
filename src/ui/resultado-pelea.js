// Ventana con el resultado de una pelea de jefe: ganaste o perdiste, con
// "Revancha" y "Volver a los jefes".
//
//   mostrarResultadoPelea({ gano: true, titulo: '¡Le ganaste a Uriel!', detalle: 'Tú: 30 · Uriel: 12', alRevancha });
//
// Para otras peleas (el Duelo): `alRevancha: null` quita ese botón,
// `icono` cambia el 🏆/💀 y `volver: { texto, ruta }` el otro botón.
// Devuelve con qué cambiar la ventana mientras está abierta (el Duelo
// avisa así si el rival pide la revancha o se va):
//   const ventana = mostrarResultadoPelea({ ... });
//   ventana.avisar('Tu rival quiere la revancha.');
//   ventana.quitarRevancha();

import { navegar } from '../router.js';
import { abrirModal } from './modal.js';
import { terminarPelea } from './pelea-en-curso.js';

export function mostrarResultadoPelea({
  gano,
  titulo,
  detalle,
  alRevancha,
  icono = gano ? '🏆' : '💀',
  volver = { texto: 'Volver a los jefes', ruta: 'jefes' },
}) {
  terminarPelea(); // desde aquí se puede salir sin confirmar
  const contenido = document.createElement('div');
  contenido.className = 'resultado-pelea';
  contenido.innerHTML = `
    <span class="resultado-pelea-icono">${icono}</span>
    <p class="modal-texto"></p>
    <p class="resultado-pelea-aviso hidden"></p>
    <div class="fila-acciones">
      ${alRevancha ? '<button type="button" class="btn btn-primary" data-accion="revancha">Revancha</button>' : ''}
      <button type="button" class="btn btn-secondary" data-accion="volver"></button>
    </div>
  `;
  contenido.querySelector('.modal-texto').textContent = detalle;
  contenido.querySelector('[data-accion="volver"]').textContent = volver.texto;

  let destino = null;
  const modal = abrirModal({
    titulo,
    contenido,
    alCerrar: () => (destino === 'revancha' ? alRevancha() : navegar(volver.ruta)),
  });
  contenido.querySelectorAll('[data-accion]').forEach((boton) => {
    boton.addEventListener('click', () => {
      destino = boton.dataset.accion;
      modal.cerrar();
    });
  });

  return {
    avisar(texto) {
      const aviso = contenido.querySelector('.resultado-pelea-aviso');
      aviso.textContent = texto;
      aviso.classList.remove('hidden');
    },
    quitarRevancha() {
      contenido.querySelector('[data-accion="revancha"]')?.remove();
    },
  };
}
