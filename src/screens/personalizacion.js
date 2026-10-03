// Pantalla de Personalización: colores del juego y preferencias.
// Todo se guarda solo, en cuanto el jugador cambia algo; no hay botón
// "Guardar".

import { CAMPOS_TEMA, aplicarTema, guardarTema, restablecerTema, temaCompleto } from '../tema.js';
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
        <p class="campo-ayuda tarjeta-ayuda">
          El color principal define el fondo; los paneles usan versiones más claras de él.
          Los demás colorean el tablero según lo que pase en cada celda.
        </p>
        ${MUESTRA_TABLERO}
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

    function leerColoresElegidos() {
      return Object.fromEntries(entradasColor.map((entrada) => [entrada.dataset.color, entrada.value]));
    }

    function mostrarValoresGuardados() {
      const tema = temaCompleto(obtenerGuardado().perfil.tema);
      entradasColor.forEach((entrada) => {
        entrada.value = tema[entrada.dataset.color];
      });
      const preferencias = leerPreferencias();
      interruptores.forEach((interruptor) => {
        interruptor.checked = preferencias[interruptor.dataset.preferencia];
      });
    }

    // "input" llega mientras se arrastra en el selector (vista previa en
    // vivo); "change" cuando el jugador lo suelta (ahí se guarda).
    entradasColor.forEach((entrada) => {
      entrada.addEventListener('input', () => aplicarTema(leerColoresElegidos()));
      entrada.addEventListener('change', () => guardarTema(leerColoresElegidos()));
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
