// Ventana con el resultado de una pelea de jefe: ganaste o perdiste, con
// "Revancha" y "Volver al menú".
//
//   mostrarResultadoPelea({ gano: true, titulo: '¡Le ganaste a Uriel!', detalle: 'Tú: 30 · Uriel: 12', alRevancha });

import { RUTA_INICIO, navegar } from '../router.js';
import { abrirModal } from './modal.js';

export function mostrarResultadoPelea({ gano, titulo, detalle, alRevancha }) {
  const contenido = document.createElement('div');
  contenido.className = 'resultado-pelea';
  contenido.innerHTML = `
    <span class="resultado-pelea-icono">${gano ? '🏆' : '💀'}</span>
    <p class="modal-texto"></p>
    <div class="fila-acciones">
      <button type="button" class="btn btn-primary" data-accion="revancha">Revancha</button>
      <button type="button" class="btn btn-secondary" data-accion="menu">Volver al menú</button>
    </div>
  `;
  contenido.querySelector('.modal-texto').textContent = detalle;

  let destino = null;
  const modal = abrirModal({
    titulo,
    contenido,
    alCerrar: () => (destino === 'revancha' ? alRevancha() : navegar(RUTA_INICIO)),
  });
  contenido.querySelectorAll('[data-accion]').forEach((boton) => {
    boton.addEventListener('click', () => {
      destino = boton.dataset.accion;
      modal.cerrar();
    });
  });
}
