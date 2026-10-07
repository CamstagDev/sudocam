// Tarjeta de arriba en una pelea de jefe: a la izquierda el retrato, tan
// alto como todo lo demás; a la derecha nombre, fase, descripción, iconos
// de habilidades y, según el jefe, un marcador de puntos o un reloj grande.
//
//   const cabecera = crearCabeceraJefe(contenedor, {
//     id: 'uriel', uber: false,
//     habilidades: [{ id: 'facil', emoji: '🔍', nombre: '123...', imagen, oculta: false, seccion }],
//     marcador: true,      tira y afloja jugador vs. jefe (Uriel)
//     reloj: false,        cuenta regresiva grande (Hecate)
//     fases: true,         false si el jefe no tiene fases (Babel)
//     habilidadesSilenciosas: por defecto en los uber (Uriel, Hecate,
//                          Jörmungandr, Babel), que no telegrafían nada: se ven
//                          todos los iconos desde el principio, pero sin carga,
//                          destellos, contadores ni cambios (ver
//                          icono-habilidad.js). Typhon uber pasa false.
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

import { JEFES, imagenDeHabilidad } from '../game/jefes/catalogo.js';
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

// El retrato mide de lado lo mismo que el alto de la columna de la derecha
// (a lo sumo un tercio del ancho de la tarjeta, para que en el teléfono le
// quede espacio a lo demás). Se recalcula si cambia el tamaño: al girar el
// teléfono, al aparecer una habilidad...
const FRACCION_MAXIMA_DEL_ANCHO = 1 / 3;

function ajustarRetratoAlAlto(tarjeta, contenido) {
  let pendiente = false;
  const ajustar = () => {
    pendiente = false;
    const lado = Math.min(contenido.offsetHeight, tarjeta.clientWidth * FRACCION_MAXIMA_DEL_ANCHO);
    tarjeta.style.setProperty('--lado-retrato', `${Math.round(lado)}px`);
  };
  // En el siguiente cuadro, para no cambiar tamaños mientras el navegador
  // todavía está avisando de cambios de tamaño.
  const observador = new ResizeObserver(() => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(ajustar);
  });
  observador.observe(contenido);
  observador.observe(tarjeta);
}

// Una habilidad de la cabecera a partir de su sección del catálogo: mismo
// nombre, emoji, dibujo y carta que en la página de información.
//   habilidadDeSeccion('vision', JEFES.hecate.ataque1, { oculta: true })
export function habilidadDeSeccion(id, seccion, extra = {}) {
  return {
    id,
    emoji: seccion.emoji,
    nombre: seccion.titulo,
    imagen: seccion.imagen ? imagenDeHabilidad(seccion.imagen) : null,
    seccion,
    ...extra,
  };
}

export function crearCabeceraJefe(contenedor, {
  id,
  uber = false,
  habilidades = [],
  marcador = false,
  reloj = false,
  fases = true,
  habilidadesSilenciosas = uber,
}) {
  const jefe = JEFES[id];
  const nombre = jefe.normal ? JEFES[jefe.normal].nombre : jefe.nombre;

  const tarjeta = document.createElement('section');
  tarjeta.className = 'card cabecera-jefe';
  tarjeta.innerHTML = `
    <div data-id="retrato"></div>
    <div class="cabecera-jefe-contenido" data-id="contenido">
      <div class="cabecera-jefe-texto">
        <p class="cabecera-jefe-nombre">
          ${nombre}
          ${uber ? '<span class="badge negativo">UBER</span>' : ''}
          <span class="badge ${fases ? '' : 'hidden'}" data-id="fase">Fase 1</span>
        </p>
        <p class="campo-ayuda" data-id="descripcion"></p>
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
    </div>
  `;
  contenedor.appendChild(tarjeta);
  const parte = (nombreParte) => tarjeta.querySelector(`[data-id="${nombreParte}"]`);

  const retrato = crearRetratoJefe(id);
  parte('retrato').replaceWith(retrato);
  ajustarRetratoAlAlto(tarjeta, parte('contenido'));

  const iconos = {};
  for (const habilidad of habilidades) {
    const icono = crearIconoHabilidad({ ...habilidad, silenciosa: habilidadesSilenciosas });
    // Que una habilidad aparezca a mitad de pelea ya es una pista.
    icono.elemento.classList.toggle('hidden', Boolean(habilidad.oculta) && !habilidadesSilenciosas);
    if (habilidad.seccion) mostrarCartaAlPasar(icono.elemento, habilidad.seccion, jefe.normal ?? id);
    parte('habilidades').appendChild(icono.elemento);
    iconos[habilidad.id] = icono;
  }
  if (habilidades.length === 0) parte('habilidades').classList.add('hidden');

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
