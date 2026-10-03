// Pantalla de Logros: todos los logros por sección, con su estado.
// Mientras un logro está bloqueado se ve su nombre (como pista) pero no
// su descripción.

import { SECCIONES } from '../game/logros/catalogo.js';
import { logrosConEstado } from '../game/logros/logros.js';

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

function contarDesbloqueados(logros) {
  return logros.filter((logro) => logro.desbloqueado).length;
}

export const pantallaLogros = {
  titulo: 'Logros',
  subtitulo: () => {
    const logros = logrosConEstado();
    return `${contarDesbloqueados(logros)} de ${logros.length} desbloqueados`;
  },

  render(contenedor) {
    const porId = new Map(logrosConEstado().map((logro) => [logro.id, logro]));

    contenedor.innerHTML = SECCIONES.map((seccion) => {
      const logros = seccion.logros.map((logro) => porId.get(logro.id));
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
