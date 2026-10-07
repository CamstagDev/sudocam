// Página del modo Jefes: #/jefes
//
// Su título y el carrusel de los jefes desbloqueados (ver
// ui/carrusel-jefes.js). Los bloqueados no se insinúan de ninguna forma, y
// sin ninguno desbloqueado la página no existe: se vuelve al inicio.

import { RUTA_INICIO, navegar } from '../router.js';
import { ORDEN_JEFES } from '../game/jefes/catalogo.js';
import { jefeDesbloqueado } from '../game/jefes/registro.js';
import { crearCarruselJefes } from '../ui/carrusel-jefes.js';
import { tituloDeModo } from '../ui/modos.js';

export const pantallaJefes = {
  render(contenedor) {
    const desbloqueados = ORDEN_JEFES.filter((id) => jefeDesbloqueado(id));
    if (desbloqueados.length === 0) {
      navegar(RUTA_INICIO);
      return;
    }

    contenedor.innerHTML = `<section class="menu-seccion">${tituloDeModo('jefes')}</section>`;
    contenedor.querySelector('.menu-seccion').appendChild(crearCarruselJefes(desbloqueados));
  },
};
