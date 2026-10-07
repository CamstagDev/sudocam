// Pantalla "Información del jefe": #/jefe?id=uriel
//
// Arriba, el jefe: su ilustración completa (la de su carta) o, si todavía
// no tiene, su retrato redondo; su nombre, su historia y tus estadísticas.
// Debajo, una carta por cada habilidad, la pasiva y el secreto (ver
// ui/carta-habilidad.js). Cada carta se ve bloqueada hasta cumplir lo que
// pide (ver seDesbloqueaCon en game/jefes/catalogo.js), con una pista de
// cómo desbloquearla.

import { JEFES, SECCIONES_INFORMACION, imagenDeCarta } from '../game/jefes/catalogo.js';
import { estadisticasDeJefe, jefeDesbloqueado, seccionDesbloqueada } from '../game/jefes/registro.js';
import { crearRetratoJefe } from '../ui/retrato-jefe.js';
import { crearCartaHabilidad } from '../ui/carta-habilidad.js';
import { buscarImagenDeJefe } from '../ui/imagen-de-jefe.js';
import { formatearSegundos } from '../ui/cronometro.js';

function textoDeEstadisticas(jefe, stats) {
  if (stats.victorias === 0) return `Todavía no le has ganado a ${jefe.nombre}.`;
  return `Victorias: ${stats.victorias} · Mejor tiempo: ${formatearSegundos(stats.mejorTiempo)}`;
}

async function ponerImagenDeCabecera(cabecera, id) {
  const ruta = await buscarImagenDeJefe(id, imagenDeCarta);
  if (!ruta) {
    cabecera.querySelector('.cabecera-jefe-fila').prepend(crearRetratoJefe(id, { tamano: 'grande', etiqueta: 'div' }));
    return;
  }
  const ilustracion = new Image();
  ilustracion.className = 'ilustracion-jefe';
  ilustracion.alt = JEFES[id].nombre;
  ilustracion.src = ruta;
  cabecera.prepend(ilustracion);
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
        <div class="cabecera-jefe-texto">
          <h1 class="cabecera-jefe-nombre"></h1>
          <p class="descripcion-jefe" data-id="descripcion"></p>
        </div>
      </div>
      <p class="campo-ayuda estadisticas-jefe" data-id="estadisticas"></p>
    `;
    ponerImagenDeCabecera(cabecera, id);
    cabecera.querySelector('h1').textContent = jefe.nombre;
    cabecera.querySelector('[data-id="descripcion"]').textContent = jefe.descripcion;
    cabecera.querySelector('[data-id="estadisticas"]').textContent = textoDeEstadisticas(jefe, stats);
    contenedor.appendChild(cabecera);

    const cartas = document.createElement('div');
    cartas.className = 'cartas-habilidades';
    for (const seccion of SECCIONES_INFORMACION.map((nombre) => jefe[nombre]).filter(Boolean)) {
      cartas.appendChild(crearCartaHabilidad(seccion, { desbloqueada: seccionDesbloqueada(seccion, stats) }));
    }
    contenedor.appendChild(cartas);
  },
};
