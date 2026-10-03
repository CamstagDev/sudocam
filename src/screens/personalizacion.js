// Pantalla de Personalización: tema de colores y preferencias de juego.
// Todo se guarda solo, en cuanto el jugador cambia algo; no hay botón
// "Guardar".
//
// Elegir un tema predefinido pone sus colores en los selectores; cambiar
// cualquier color a mano pasa a "Personalizado" (ver temaEnUso en tema.js).

import {
  CAMPOS_TEMA,
  TEMAS,
  aplicarTema,
  guardarTema,
  restablecerTema,
  temaCompleto,
  temaEnUso,
} from '../tema.js';
import {
  CAMPOS_PREFERENCIAS,
  guardarPreferencia,
  leerPreferencias,
  restablecerPreferencias,
} from '../preferencias.js';
import { obtenerGuardado } from '../save/guardado.js';

function campoColor({ id, nombre }) {
  return `
    <label class="campo-color">
      <input type="color" data-color="${id}" />
      <span>${nombre}</span>
    </label>
  `;
}

// Botón de un tema: se pinta con sus propios colores, como vista previa.
function botonTema({ id, nombre, colores }) {
  return `
    <button type="button" class="opcion-tema" data-tema="${id}"
      style="background: ${colores.fondo}; color: ${colores.texto}">
      <span class="opcion-tema-puntos">
        <span style="background: ${colores.acento}"></span>
        <span style="background: ${colores.pista}"></span>
        <span style="background: ${colores.error}"></span>
      </span>
      ${nombre}
    </button>
  `;
}

const BOTON_PERSONALIZADO = `
  <span class="opcion-tema personalizado" data-tema="personalizado">
    <span class="opcion-tema-puntos"><span></span><span></span><span></span></span>
    Personalizado
  </span>
`;

function filaPreferencia({ id, nombre, descripcion }) {
  return `
    <label class="fila-interruptor">
      <span>
        <span class="fila-interruptor-nombre">${nombre}</span>
        <span class="fila-interruptor-detalle">${descripcion}</span>
      </span>
      <input type="checkbox" class="interruptor" data-preferencia="${id}" />
    </label>
  `;
}

// Unas celdas de ejemplo para ver los colores sin salir de la pantalla.
const MUESTRA_TABLERO = `
  <div class="muestra-tablero" aria-hidden="true">
    <span class="celda fija">5</span>
    <span class="celda">3</span>
    <span class="celda seleccionada">8</span>
    <span class="celda relacionada"></span>
    <span class="celda error">7</span>
    <span class="celda acierto">1</span>
    <span class="celda jefe">4</span>
  </div>
`;

export const pantallaPersonalizacion = {
  titulo: 'Personalización',
  subtitulo: 'Todo se guarda solo',

  render(contenedor) {
    contenedor.innerHTML = `
      <section class="card">
        <div class="cabecera-tarjeta">
          <h2 class="section-title">Colores</h2>
          <button type="button" class="btn btn-secondary btn-sm" id="restablecer-colores">Restaurar</button>
        </div>
        <div class="grilla-temas">${TEMAS.map(botonTema).join('')}${BOTON_PERSONALIZADO}</div>
        ${MUESTRA_TABLERO}
        <p class="campo-ayuda tarjeta-ayuda">
          Los paneles y bordes se calculan a partir del fondo y el texto. Cambiar cualquier
          color pasa tu tema a "Personalizado".
        </p>
        <div class="grilla-colores">${CAMPOS_TEMA.map(campoColor).join('')}</div>
      </section>

      <section class="card">
        <div class="cabecera-tarjeta">
          <h2 class="section-title">Preferencias de juego</h2>
          <button type="button" class="btn btn-secondary btn-sm" id="restablecer-preferencias">Restaurar</button>
        </div>
        <div class="lista-interruptores">${CAMPOS_PREFERENCIAS.map(filaPreferencia).join('')}</div>
      </section>
    `;

    const entradasColor = [...contenedor.querySelectorAll('[data-color]')];
    const interruptores = [...contenedor.querySelectorAll('[data-preferencia]')];
    const opcionesTema = [...contenedor.querySelectorAll('[data-tema]')];

    function leerColoresElegidos() {
      return Object.fromEntries(entradasColor.map((entrada) => [entrada.dataset.color, entrada.value]));
    }

    function marcarTemaEnUso(colores) {
      const enUso = temaEnUso(colores);
      opcionesTema.forEach((opcion) => opcion.classList.toggle('activo', opcion.dataset.tema === enUso));
    }

    function mostrarValoresGuardados() {
      const tema = temaCompleto(obtenerGuardado().perfil.tema);
      entradasColor.forEach((entrada) => {
        entrada.value = tema[entrada.dataset.color];
      });
      marcarTemaEnUso(tema);
      const preferencias = leerPreferencias();
      interruptores.forEach((interruptor) => {
        interruptor.checked = preferencias[interruptor.dataset.preferencia];
      });
    }

    // "input" llega mientras se arrastra en el selector (vista previa en
    // vivo); "change" cuando el jugador lo suelta (ahí se guarda).
    entradasColor.forEach((entrada) => {
      entrada.addEventListener('input', () => {
        aplicarTema(leerColoresElegidos());
        marcarTemaEnUso(leerColoresElegidos());
      });
      entrada.addEventListener('change', () => guardarTema(leerColoresElegidos()));
    });

    opcionesTema.forEach((opcion) => {
      const tema = TEMAS.find(({ id }) => id === opcion.dataset.tema);
      if (!tema) return; // "Personalizado" solo indica, no se elige
      opcion.addEventListener('click', async () => {
        aplicarTema(tema.colores);
        await guardarTema(tema.colores);
        mostrarValoresGuardados();
      });
    });

    interruptores.forEach((interruptor) => {
      interruptor.addEventListener('change', () => {
        guardarPreferencia(interruptor.dataset.preferencia, interruptor.checked);
      });
    });

    contenedor.querySelector('#restablecer-colores').addEventListener('click', async () => {
      await restablecerTema();
      mostrarValoresGuardados();
    });

    contenedor.querySelector('#restablecer-preferencias').addEventListener('click', async () => {
      await restablecerPreferencias();
      mostrarValoresGuardados();
    });

    mostrarValoresGuardados();
  },
};
