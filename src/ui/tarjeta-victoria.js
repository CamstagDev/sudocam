// Tarjeta "¡Resuelto!" con "Jugar otra vez" y "Volver al menú". Empieza
// oculta; mostrar() la enseña con el tiempo final.
//
//   const victoria = crearTarjetaVictoria(contenedor, { titulo: '¡Sudoku resuelto!', alJugarOtraVez });
//   (textoOtraVez cambia lo que dice ese botón)
//   victoria.mostrar(segundos);

import { RUTA_INICIO, navegar } from '../router.js';
import { formatearSegundos } from './cronometro.js';

export function crearTarjetaVictoria(contenedor, { titulo, alJugarOtraVez, textoOtraVez = 'Jugar otra vez' }) {
  const tarjeta = document.createElement('section');
  tarjeta.className = 'card victoria hidden';
  tarjeta.innerHTML = `
    <span class="victoria-icono">🎉</span>
    <h2></h2>
    <p class="campo-ayuda"></p>
    <div class="fila-acciones">
      <button type="button" class="btn btn-primary" data-accion="otra-vez">Jugar otra vez</button>
      <button type="button" class="btn btn-secondary" data-accion="menu">Volver al menú</button>
    </div>
  `;
  tarjeta.querySelector('h2').textContent = titulo;
  tarjeta.querySelector('[data-accion="otra-vez"]').textContent = textoOtraVez;
  tarjeta.querySelector('[data-accion="otra-vez"]').addEventListener('click', alJugarOtraVez);
  tarjeta.querySelector('[data-accion="menu"]').addEventListener('click', () => navegar(RUTA_INICIO));
  contenedor.prepend(tarjeta);

  return {
    mostrar(segundos) {
      tarjeta.querySelector('p').textContent = `Lo lograste en ${formatearSegundos(segundos)}`;
      tarjeta.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  };
}
