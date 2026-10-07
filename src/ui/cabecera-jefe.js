// Tarjeta de arriba en una pelea de jefe: retrato, nombre, fase,
// descripción, iconos de habilidades y, según el jefe, un marcador de
// puntos o un reloj grande.
//
//   const cabecera = crearCabeceraJefe(contenedor, {
//     id: 'uriel', uber: false,
//     habilidades: [{ id: 'facil', emoji: '🔍', nombre: '123...', imagen, oculta: false, seccion }],
//     marcador: true,      tira y afloja jugador vs. jefe (Uriel)
//     reloj: false,        cuenta regresiva grande (Hecate)
//     fases: true,         false si el jefe no tiene fases (Babel)
//     mostrarHabilidades:  por defecto ocultas en los uber de Uriel y Hecate,
//                          que no telegrafían nada; los demás uber las muestran
//   });
//   Con `seccion` (la del catálogo), pasar el mouse por el icono muestra la
//   carta de esa habilidad (ver carta-habilidad.js), tal como se ve en la
//   página de información: bloqueada mientras no se haya investigado.
//
//   cabecera.retrato                  el botón del retrato (para secretos)
//   cabecera.habilidades.facil        ver icono-habilidad.js
//   cabecera.mostrarFase(2, 'Descripción de la fase 2');
//   cabecera.mostrarPuntos({ jugador, jefe, total });
//   cabecera.mostrarReloj(segundos, critico);

import { JEFES } from '../game/jefes/catalogo.js';
import { crearRetratoJefe } from './retrato-jefe.js';
import { crearIconoHabilidad } from './icono-habilidad.js';
import { crearCartaHabilidad } from './carta-habilidad.js';
import { mostrarAlPasar } from './carta-flotante.js';
import { estadisticasDeJefe, seccionDesbloqueada } from '../game/jefes/registro.js';
import { formatearSegundos } from './cronometro.js';

// La carta de la habilidad reemplaza al cartelito del navegador (title).
// Se desbloquea con las estadísticas del jefe normal, como su página.
function mostrarCartaAlPasar(elemento, seccion, idNormal) {
  elemento.removeAttribute('title');
  elemento.classList.add('con-carta');
  elemento.setAttribute('aria-label', seccion.titulo);
  mostrarAlPasar(elemento, () => crearCartaHabilidad(seccion, {
    desbloqueada: seccionDesbloqueada(seccion, estadisticasDeJefe(idNormal)),
  }));
}

export function crearCabeceraJefe(contenedor, {
  id,
  uber = false,
  habilidades = [],
  marcador = false,
  reloj = false,
  fases = true,
  mostrarHabilidades = !uber,
}) {
  const jefe = JEFES[id];
  const nombre = jefe.normal ? JEFES[jefe.normal].nombre : jefe.nombre;

  const tarjeta = document.createElement('section');
  tarjeta.className = 'card cabecera-jefe';
  tarjeta.innerHTML = `
    <div class="cabecera-jefe-fila">
      <div data-id="retrato"></div>
      <div class="cabecera-jefe-texto">
        <p class="cabecera-jefe-nombre">
          ${nombre}
          ${uber ? '<span class="badge negativo">UBER</span>' : ''}
          <span class="badge ${fases ? '' : 'hidden'}" data-id="fase">Fase 1</span>
        </p>
        <p class="campo-ayuda" data-id="descripcion"></p>
      </div>
    </div>
    ${reloj ? '<p class="reloj-jefe" data-id="reloj"></p>' : ''}
    <div class="habilidades" data-id="habilidades"></div>
    ${marcador ? `
      <div class="marcador">
        <span class="marcador-lado jugador"><small>Tú</small><strong data-id="puntos-jugador">0</strong></span>
        <span class="marcador-barra">
          <span class="marcador-relleno jugador" data-id="barra-jugador"></span>
          <span class="marcador-relleno jefe" data-id="barra-jefe"></span>
        </span>
        <span class="marcador-lado jefe"><small>${nombre}</small><strong data-id="puntos-jefe">0</strong></span>
      </div>` : ''}
  `;
  contenedor.appendChild(tarjeta);
  const parte = (nombreParte) => tarjeta.querySelector(`[data-id="${nombreParte}"]`);

  const retrato = crearRetratoJefe(id);
  parte('retrato').replaceWith(retrato);

  const iconos = {};
  for (const habilidad of habilidades) {
    const icono = crearIconoHabilidad(habilidad);
    icono.elemento.classList.toggle('hidden', Boolean(habilidad.oculta));
    if (habilidad.seccion) mostrarCartaAlPasar(icono.elemento, habilidad.seccion, jefe.normal ?? id);
    parte('habilidades').appendChild(icono.elemento);
    iconos[habilidad.id] = icono;
  }
  if (!mostrarHabilidades || habilidades.length === 0) parte('habilidades').classList.add('hidden');

  return {
    retrato,
    habilidades: iconos,

    mostrarFase(fase, descripcion) {
      parte('fase').textContent = `Fase ${fase}`;
      parte('fase').classList.toggle('negativo', fase === 2);
      parte('descripcion').textContent = descripcion;
    },

    mostrarPuntos({ jugador, jefe: puntosJefe, total }) {
      parte('puntos-jugador').textContent = String(jugador);
      parte('puntos-jefe').textContent = String(puntosJefe);
      parte('barra-jugador').style.width = `${(jugador / total) * 100}%`;
      parte('barra-jefe').style.width = `${(puntosJefe / total) * 100}%`;
    },

    mostrarReloj(segundos, critico = false) {
      parte('reloj').textContent = formatearSegundos(segundos);
      parte('reloj').classList.toggle('critico', critico);
    },
  };
}
