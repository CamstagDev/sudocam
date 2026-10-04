// Pantalla de Personalización: tema de colores y preferencias de juego.
// Todo se guarda solo, en cuanto el jugador cambia algo; no hay botón
// "Guardar".
//
// Elegir un tema predefinido pone sus colores y su borde en los
// selectores; cambiar cualquiera a mano pasa a "Personalizado" (ver
// temaEnUso en tema.js).
//
// Mientras no haya ningún jefe desbloqueado, el color de los jefes y su
// casilla de ejemplo no se muestran (el selector sigue en la página, oculto,
// para que el tema guardado conserve ese color).

import {
  CAMPOS_TEMA,
  TEMAS,
  aplicarTema,
  guardarTema,
  restablecerTema,
  temaCompleto,
  temaEnUso,
  valoresDelTema,
} from '../tema.js';
import { BORDES, imagenDeBorde } from '../bordes.js';
import {
  CAMPOS_PREFERENCIAS,
  guardarPreferencia,
  leerPreferencias,
  restablecerPreferencias,
} from '../preferencias.js';
import { obtenerGuardado } from '../save/guardado.js';
import { hayJefesDesbloqueados } from '../game/jefes/registro.js';

const COLOR_DE_LOS_JEFES = 'jefe';

function campoColor({ id, nombre }, { oculto = false } = {}) {
  return `
    <label class="campo-color" ${oculto ? 'hidden' : ''}>
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

// Opción de borde: un cuadrito con ese borde y su nombre.
function opcionBorde([id, { nombre }]) {
  return `
    <button type="button" class="opcion-borde" data-borde="${id}">
      <span class="muestra-borde"></span>
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
function muestraTablero({ conJefes }) {
  return `
    <div class="muestra-tablero" aria-hidden="true">
      <span class="celda fija">5</span>
      <span class="celda">3</span>
      <span class="celda seleccionada">8</span>
      <span class="celda relacionada"></span>
      <span class="celda error"><span class="celda-valor">7</span></span>
      <span class="celda acierto">1</span>
      ${conJefes ? '<span class="celda jefe">4</span>' : ''}
    </div>
  `;
}

export const pantallaPersonalizacion = {
  titulo: 'Personalización',
  subtitulo: 'Todo se guarda solo',

  render(contenedor) {
    const conJefes = hayJefesDesbloqueados();
    const camposColor = CAMPOS_TEMA.map((campo) => campoColor(campo, {
      oculto: campo.id === COLOR_DE_LOS_JEFES && !conJefes,
    }));

    contenedor.innerHTML = `
      <section class="card">
        <div class="cabecera-tarjeta">
          <h2 class="section-title">Colores</h2>
          <button type="button" class="btn btn-secondary btn-sm" id="restablecer-colores">Restaurar</button>
        </div>
        <div class="grilla-temas">${TEMAS.map(botonTema).join('')}${BOTON_PERSONALIZADO}</div>
        ${muestraTablero({ conJefes })}
        <p class="campo-ayuda tarjeta-ayuda">
          Los paneles y bordes se calculan a partir del fondo y el texto. Cambiar cualquier
          color o el borde pasa tu tema a "Personalizado".
        </p>
        <div class="grilla-colores">${camposColor.join('')}</div>
        <h3 class="subtitulo-tarjeta">Borde de las tarjetas</h3>
        <div class="grilla-bordes">${Object.entries(BORDES).map(opcionBorde).join('')}</div>
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
    const opcionesBorde = [...contenedor.querySelectorAll('[data-borde]')];
    let bordeElegido = null;

    function leerTemaElegido() {
      const colores = Object.fromEntries(entradasColor.map((entrada) => [entrada.dataset.color, entrada.value]));
      return { ...colores, borde: bordeElegido };
    }

    // Marca el tema y el borde en uso; las muestras de borde se pintan
    // con el color de acento elegido.
    function marcarElegidos(tema) {
      const enUso = temaEnUso(tema);
      opcionesTema.forEach((opcion) => opcion.classList.toggle('activo', opcion.dataset.tema === enUso));
      opcionesBorde.forEach((opcion) => {
        opcion.classList.toggle('activo', opcion.dataset.borde === tema.borde);
        opcion.querySelector('.muestra-borde').style.borderImageSource = imagenDeBorde(opcion.dataset.borde, tema.acento);
      });
    }

    // Vista previa al instante, sin guardar (mientras se arrastra un color).
    function previsualizar() {
      aplicarTema(leerTemaElegido());
      marcarElegidos(temaCompleto(leerTemaElegido()));
    }

    function mostrarValoresGuardados() {
      const tema = temaCompleto(obtenerGuardado().perfil.tema);
      entradasColor.forEach((entrada) => {
        entrada.value = tema[entrada.dataset.color];
      });
      bordeElegido = tema.borde;
      marcarElegidos(tema);
      const preferencias = leerPreferencias();
      interruptores.forEach((interruptor) => {
        interruptor.checked = preferencias[interruptor.dataset.preferencia];
      });
    }

    // "input" llega mientras se arrastra en el selector (vista previa en
    // vivo); "change" cuando el jugador lo suelta (ahí se guarda).
    entradasColor.forEach((entrada) => {
      entrada.addEventListener('input', previsualizar);
      entrada.addEventListener('change', () => guardarTema(leerTemaElegido()));
    });

    opcionesBorde.forEach((opcion) => {
      opcion.addEventListener('click', async () => {
        bordeElegido = opcion.dataset.borde;
        previsualizar();
        await guardarTema(leerTemaElegido());
      });
    });

    opcionesTema.forEach((opcion) => {
      const tema = TEMAS.find(({ id }) => id === opcion.dataset.tema);
      if (!tema) return; // "Personalizado" solo indica, no se elige
      opcion.addEventListener('click', async () => {
        aplicarTema(valoresDelTema(tema));
        await guardarTema(valoresDelTema(tema));
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
