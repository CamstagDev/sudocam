// Los modos de juego, cada uno con su página: Clásico (la de inicio:
// sudoku, multi sudoku y tutorial) y Jefes. Se eligen en el menú "Modos" de
// la barra de arriba (ver shell.js), y cada página lleva su título arriba.
//
// Un modo con `imagen` se muestra con ella (en el menú y como título de su
// página); sin imagen, con su nombre. Para cambiar el título de un modo por
// una ilustración basta con ponerle `imagen` aquí.

import { RUTA_INICIO } from '../router.js';
import { hayJefesDesbloqueados } from '../game/jefes/registro.js';

export const MODOS = [
  {
    ruta: RUTA_INICIO,
    nombre: 'Clásico',
    imagen: './img/titulos/clasico.png',
    disponible: () => true,
  },
  {
    ruta: 'jefes',
    nombre: 'Jefes',
    imagen: './img/titulos/jefes.png',
    // Mientras no haya ningún jefe desbloqueado, el modo no existe.
    disponible: hayJefesDesbloqueados,
  },
];

export function buscarModo(ruta) {
  return MODOS.find((modo) => modo.ruta === ruta) ?? null;
}

// El nombre o la imagen del modo; la imagen lleva el nombre para los
// lectores de pantalla.
export function contenidoDelModo({ nombre, imagen }) {
  return imagen
    ? `<img src="${imagen}" alt="" /><span class="solo-lectores">${nombre}</span>`
    : nombre;
}

// El título de arriba de la página de un modo.
export function tituloDeModo(ruta) {
  const modo = buscarModo(ruta);
  return `<h2 class="titulo-modo ${modo.imagen ? 'con-imagen' : ''}">${contenidoDelModo(modo)}</h2>`;
}
