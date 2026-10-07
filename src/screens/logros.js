// Pantalla de Logros: todos los logros por sección, con su estado.
// Mientras un logro está bloqueado se ve su nombre (como pista) pero no
// su descripción. Los logros de jefes todavía bloqueados no aparecen
// (ver game/logros/visibles.js).

import { SECCIONES } from '../game/logros/catalogo.js';
import { logrosVisiblesConEstado } from '../game/logros/visibles.js';
import { ultimosLogros } from '../game/logros/logros.js';

function formatearFecha(iso) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function barraDeProgreso({ actual, objetivo }) {
  const porcentaje = Math.round((actual / objetivo) * 100);
  return `
    <div class="logro-progreso" aria-label="${actual} de ${objetivo}">
      <div class="logro-progreso-relleno" style="width: ${porcentaje}%"></div>
    </div>
    <p class="logro-progreso-texto">${actual}/${objetivo}</p>
  `;
}

function tarjetaLogro(logro) {
  return `
    <div class="logro ${logro.desbloqueado ? '' : 'bloqueado'}">
      <span class="logro-icono">${logro.desbloqueado ? logro.icono : '🔒'}</span>
      <div class="logro-cuerpo">
        <p class="logro-nombre">${logro.nombre}</p>
        <p class="logro-descripcion">${logro.desbloqueado ? logro.descripcion : 'Todavía no lo desbloqueas.'}</p>
        ${logro.progreso ? barraDeProgreso(logro.progreso) : ''}
      </div>
      ${logro.desbloqueado ? `<span class="logro-fecha">${formatearFecha(logro.fecha)}</span>` : ''}
    </div>
  `;
}

// Los últimos logros ganados, arriba de todo; no aparece hasta ganar el
// primero.
function vitrinaDeLogros() {
  const ultimos = ultimosLogros(6);
  if (ultimos.length === 0) return '';
  return `
    <section class="card vitrina-logros">
      <h2 class="section-title">Últimos logros</h2>
      <div class="vitrina-logros-iconos">
        ${ultimos.map((logro) => `<span class="vitrina-logros-icono" title="${logro.nombre}">${logro.icono}</span>`).join('')}
      </div>
    </section>
  `;
}

function contarDesbloqueados(logros) {
  return logros.filter((logro) => logro.desbloqueado).length;
}

export const pantallaLogros = {
  titulo: 'Logros',
  subtitulo: () => {
    const logros = logrosVisiblesConEstado();
    return `${contarDesbloqueados(logros)} de ${logros.length} desbloqueados`;
  },

  render(contenedor) {
    const porId = new Map(logrosVisiblesConEstado().map((logro) => [logro.id, logro]));

    contenedor.innerHTML = vitrinaDeLogros() + SECCIONES.map((seccion) => {
      const logros = seccion.logros.filter((logro) => porId.has(logro.id)).map((logro) => porId.get(logro.id));
      if (logros.length === 0) return '';
      return `
        <section class="card">
          <div class="cabecera-tarjeta">
            <h2 class="section-title">${seccion.nombre}</h2>
            <span class="campo-ayuda">${contarDesbloqueados(logros)}/${logros.length}</span>
          </div>
          <div class="lista-logros">${logros.map(tarjetaLogro).join('')}</div>
        </section>
      `;
    }).join('');
  },
};
