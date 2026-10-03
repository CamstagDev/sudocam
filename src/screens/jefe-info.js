// Pantalla "Información del jefe": #/jefe?id=uriel
//
// Muestra al jefe y sus secciones (ataques, secreto). Cada sección se ve
// tachada hasta cumplir lo que pide (ver seDesbloqueaCon en
// game/jefes/catalogo.js), con una pista de cómo desbloquearla.

import { JEFES, SECCIONES_INFORMACION } from '../game/jefes/catalogo.js';
import { estadisticasDeJefe, jefeDesbloqueado } from '../game/jefes/registro.js';
import { crearRetratoJefe } from '../ui/retrato-jefe.js';
import { formatearSegundos } from '../ui/cronometro.js';

function textoDeEstadisticas(jefe, stats) {
  if (stats.victorias === 0) return `Todavía no le has ganado a ${jefe.nombre}.`;
  return `Victorias: ${stats.victorias} · Mejor tiempo: ${formatearSegundos(stats.mejorTiempo)}`;
}

function tarjetaSeccion(seccion, stats) {
  // Las secciones de los uber no tienen condición: se ven siempre.
  const desbloqueada = !seccion.seDesbloqueaCon || seccion.seDesbloqueaCon(stats);
  const tarjeta = document.createElement('section');
  tarjeta.className = `card seccion-jefe ${desbloqueada ? '' : 'bloqueada'}`;

  if (desbloqueada) {
    tarjeta.innerHTML = '<h2 class="section-title"></h2><p></p>';
    tarjeta.querySelector('h2').textContent = seccion.titulo;
    tarjeta.querySelector('p').textContent = seccion.texto;
  } else {
    tarjeta.innerHTML = `
      <h2 class="section-title">???</h2>
      <div class="texto-tachado" aria-hidden="true"><span></span><span></span><span></span></div>
      <p class="campo-ayuda pista-seccion"></p>
    `;
    tarjeta.querySelector('.pista-seccion').textContent = seccion.pista;
  }
  return tarjeta;
}

export const pantallaJefeInfo = {
  titulo: 'Información del jefe',

  render(contenedor, params) {
    const id = params.get('id');
    const jefe = JEFES[id];

    if (!jefe || !jefeDesbloqueado(id)) {
      contenedor.innerHTML = '<div class="empty-state">Todavía no puedes ver la información de este jefe.</div>';
      return;
    }

    const stats = estadisticasDeJefe(id);
    const cabecera = document.createElement('section');
    cabecera.className = 'card';
    cabecera.innerHTML = `
      <div class="cabecera-jefe-fila">
        <div data-id="retrato"></div>
        <div class="cabecera-jefe-texto">
          <h1 class="cabecera-jefe-nombre"></h1>
          <p class="campo-ayuda" data-id="descripcion"></p>
        </div>
      </div>
      <p class="campo-ayuda estadisticas-jefe" data-id="estadisticas"></p>
    `;
    cabecera.querySelector('[data-id="retrato"]').replaceWith(crearRetratoJefe(id, { tamano: 'grande', etiqueta: 'div' }));
    cabecera.querySelector('h1').textContent = jefe.nombre;
    cabecera.querySelector('[data-id="descripcion"]').textContent = jefe.descripcion;
    cabecera.querySelector('[data-id="estadisticas"]').textContent = textoDeEstadisticas(jefe, stats);
    contenedor.appendChild(cabecera);

    for (const nombreSeccion of SECCIONES_INFORMACION) {
      if (jefe[nombreSeccion]) contenedor.appendChild(tarjetaSeccion(jefe[nombreSeccion], stats));
    }
  },
};
