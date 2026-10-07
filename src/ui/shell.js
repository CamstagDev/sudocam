import { RUTA_INICIO, navegar } from '../router.js';
import { descartarModales } from './modal.js';
import { MODOS, buscarModo, contenidoDelModo } from './modos.js';

// Accesos globales de la barra superior. En PC se ven como iconos sueltos;
// en el teléfono se agrupan detrás del botón ☰ (ver .solo-pc / .solo-movil
// en base.css).
const ACCESOS = [
  { ruta: 'logros', icono: '🏆', titulo: 'Logros' },
  { ruta: 'personalizacion', icono: '🎨', titulo: 'Personalización' },
  { ruta: 'guardado', icono: '💾', titulo: 'Datos de guardado' },
];

// Una opción del menú de modos (ver ui/modos.js).
function opcionDeModo(modo) {
  return `
    <button type="button" class="dropdown-item opcion-modo ${modo.imagen ? 'con-imagen' : ''}"
      data-ruta="${modo.ruta}" data-modo="${modo.ruta}">${contenidoDelModo(modo)}</button>
  `;
}

const OPCIONES_DE_MODOS = MODOS.map(opcionDeModo).join('');

// Cascarón común a todas las pantallas: barra superior (logo, título de
// la pantalla, menú de modos y accesos) y el <main> donde cada pantalla se
// dibuja.
//
// El menú "Modos" lleva a la página de cada modo de juego. En PC es un
// botón propio; en el teléfono los modos van arriba del menú ☰.
export function crearShell(raiz) {
  raiz.innerHTML = `
    <header class="navbar">
      <div class="navbar-left">
        <a href="#/${RUTA_INICIO}" class="navbar-logo" aria-label="Ir al inicio">Sudo<span>Cam</span></a>
        <div class="navbar-title" id="navbar-title">
          <p class="navbar-titulo" id="navbar-titulo"></p>
          <p class="navbar-sub" id="navbar-sub"></p>
        </div>
      </div>
      <div class="navbar-acciones">
        <button type="button" class="icon-btn hidden" id="btn-volver"></button>
        <div class="dropdown solo-pc">
          <button type="button" class="btn btn-secondary btn-sm" data-abre="menu-modos" aria-expanded="false">Modos ▾</button>
          <div class="dropdown-menu" id="menu-modos">${OPCIONES_DE_MODOS}</div>
        </div>
        ${ACCESOS.map(({ ruta, icono, titulo }) => `
          <button type="button" class="icon-btn solo-pc" data-ruta="${ruta}" title="${titulo}" aria-label="${titulo}">${icono}</button>
        `).join('')}
        <div class="dropdown solo-movil">
          <button type="button" class="icon-btn" data-abre="menu-movil" title="Menú" aria-label="Menú" aria-expanded="false">☰</button>
          <div class="dropdown-menu" id="menu-movil">
            ${OPCIONES_DE_MODOS}
            <hr class="dropdown-separador" />
            ${ACCESOS.map(({ ruta, icono, titulo }) => `
              <button type="button" class="dropdown-item" data-ruta="${ruta}">
                <span class="dropdown-item-icon">${icono}</span> ${titulo}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    </header>
    <main class="app-content" id="contenido"></main>
  `;

  const bloqueTitulo = raiz.querySelector('#navbar-title');
  const titulo = raiz.querySelector('#navbar-titulo');
  const subtitulo = raiz.querySelector('#navbar-sub');
  const btnVolver = raiz.querySelector('#btn-volver');
  const contenido = raiz.querySelector('#contenido');
  const botonesQueAbren = [...raiz.querySelectorAll('[data-abre]')];
  let pantallaActual = null;

  function cerrarMenus() {
    botonesQueAbren.forEach((boton) => {
      raiz.querySelector(`#${boton.dataset.abre}`).classList.remove('visible');
      boton.setAttribute('aria-expanded', 'false');
    });
  }

  botonesQueAbren.forEach((boton) => {
    boton.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = raiz.querySelector(`#${boton.dataset.abre}`);
      const abrir = !menu.classList.contains('visible');
      cerrarMenus();
      menu.classList.toggle('visible', abrir);
      boton.setAttribute('aria-expanded', String(abrir));
    });
  });
  document.addEventListener('click', cerrarMenus);

  // Volver: a la página de donde se llegó (pantalla.volverA, p. ej. las de
  // jefes vuelven a la página de jefes) o al inicio.
  btnVolver.addEventListener('click', () => navegar(pantallaActual?.volverA ?? RUTA_INICIO));

  raiz.querySelectorAll('.navbar [data-ruta]').forEach((boton) => {
    boton.addEventListener('click', () => {
      cerrarMenus();
      navegar(boton.dataset.ruta);
    });
  });

  // Los modos que todavía no existen para el jugador no se ven (Jefes,
  // hasta desbloquear al primero), y se marca el modo en el que está.
  function actualizarModos(ruta) {
    const modoActual = buscarModo(ruta)?.ruta ?? pantallaActual?.volverA;
    raiz.querySelectorAll('[data-modo]').forEach((opcion) => {
      opcion.classList.toggle('hidden', !buscarModo(opcion.dataset.modo).disponible());
      opcion.classList.toggle('activo', opcion.dataset.modo === modoActual);
    });
  }

  return {
    mostrarPantalla(ruta, pantalla, params) {
      pantallaActual = pantalla;
      // Las páginas de los modos no llevan título: el suyo va en la página.
      bloqueTitulo.classList.toggle('hidden', !pantalla.titulo);
      titulo.textContent = pantalla.titulo ?? '';
      const textoSubtitulo = typeof pantalla.subtitulo === 'function' ? pantalla.subtitulo(params) : pantalla.subtitulo;
      subtitulo.textContent = textoSubtitulo ?? '';
      subtitulo.classList.toggle('hidden', !textoSubtitulo);

      // Entre las páginas de los modos se va con el menú, no con "volver".
      btnVolver.classList.toggle('hidden', Boolean(buscarModo(ruta)));
      // En una pelea, "volver" es rendirse (y pide confirmación: ver
      // antesDeSalir en router.js).
      const etiqueta = pantalla.jefe ? 'Rendirse' : 'Volver';
      btnVolver.textContent = pantalla.jefe ? '🏳️' : '←';
      btnVolver.title = etiqueta;
      btnVolver.setAttribute('aria-label', etiqueta);

      raiz.querySelectorAll('.navbar [data-ruta]:not([data-modo])').forEach((boton) => {
        boton.classList.toggle('activo', boton.dataset.ruta === ruta);
      });
      actualizarModos(ruta);

      document.title = pantalla.titulo ? `SudoCam · ${pantalla.titulo}` : 'SudoCam';
      cerrarMenus();
      descartarModales();
      contenido.replaceChildren();
      pantalla.render(contenido, params);
      window.scrollTo(0, 0);
    },
  };
}
