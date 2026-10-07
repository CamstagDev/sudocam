import { RUTA_INICIO, navegar } from '../router.js';
import { descartarModales } from './modal.js';

// Accesos globales de la barra superior. En PC se ven como iconos sueltos;
// en el teléfono se agrupan detrás del botón ☰ (ver .solo-pc / .solo-movil
// en base.css).
const ACCESOS = [
  { ruta: 'logros', icono: '🏆', titulo: 'Logros' },
  { ruta: 'personalizacion', icono: '🎨', titulo: 'Personalización' },
  { ruta: 'guardado', icono: '💾', titulo: 'Datos de guardado' },
];

// Cascarón común a todas las pantallas: barra superior (logo, título de
// la pantalla y accesos) y el <main> donde cada pantalla se dibuja.
export function crearShell(raiz) {
  raiz.innerHTML = `
    <header class="navbar">
      <div class="navbar-left">
        <a href="#/${RUTA_INICIO}" class="navbar-logo" aria-label="Ir al menú">Sudo<span>Cam</span></a>
        <div class="navbar-title" id="navbar-title">
          <p class="navbar-titulo" id="navbar-titulo"></p>
          <p class="navbar-sub" id="navbar-sub"></p>
        </div>
      </div>
      <div class="navbar-acciones">
        <button type="button" class="icon-btn hidden" id="btn-volver" title="Volver al menú" aria-label="Volver al menú">←</button>
        ${ACCESOS.map(({ ruta, icono, titulo }) => `
          <button type="button" class="icon-btn solo-pc" data-ruta="${ruta}" title="${titulo}" aria-label="${titulo}">${icono}</button>
        `).join('')}
        <div class="dropdown solo-movil">
          <button type="button" class="icon-btn" id="btn-menu-movil" title="Menú" aria-label="Menú" aria-expanded="false">☰</button>
          <div class="dropdown-menu" id="menu-movil">
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
  const btnMenuMovil = raiz.querySelector('#btn-menu-movil');
  const menuMovil = raiz.querySelector('#menu-movil');
  const contenido = raiz.querySelector('#contenido');

  function cerrarMenuMovil() {
    menuMovil.classList.remove('visible');
    btnMenuMovil.setAttribute('aria-expanded', 'false');
  }

  btnVolver.addEventListener('click', () => navegar(RUTA_INICIO));

  btnMenuMovil.addEventListener('click', (e) => {
    e.stopPropagation();
    const abrir = !menuMovil.classList.contains('visible');
    menuMovil.classList.toggle('visible', abrir);
    btnMenuMovil.setAttribute('aria-expanded', String(abrir));
  });
  document.addEventListener('click', cerrarMenuMovil);

  raiz.querySelectorAll('.navbar [data-ruta]').forEach((boton) => {
    boton.addEventListener('click', () => {
      cerrarMenuMovil();
      navegar(boton.dataset.ruta);
    });
  });

  return {
    mostrarPantalla(ruta, pantalla, params) {
      // El menú no lleva título: el logo ya dice dónde estás.
      bloqueTitulo.classList.toggle('hidden', !pantalla.titulo);
      titulo.textContent = pantalla.titulo ?? '';
      const textoSubtitulo = typeof pantalla.subtitulo === 'function' ? pantalla.subtitulo(params) : pantalla.subtitulo;
      subtitulo.textContent = textoSubtitulo ?? '';
      subtitulo.classList.toggle('hidden', !textoSubtitulo);
      btnVolver.classList.toggle('hidden', ruta === RUTA_INICIO);
      // En una pelea, "volver" es rendirse (y pide confirmación: ver
      // antesDeSalir en router.js).
      const etiqueta = pantalla.jefe ? 'Rendirse' : 'Volver al menú';
      btnVolver.textContent = pantalla.jefe ? '🏳️' : '←';
      btnVolver.title = etiqueta;
      btnVolver.setAttribute('aria-label', etiqueta);
      raiz.querySelectorAll('.navbar [data-ruta]').forEach((boton) => {
        boton.classList.toggle('activo', boton.dataset.ruta === ruta);
      });
      document.title = pantalla.titulo ? `SudoCam · ${pantalla.titulo}` : 'SudoCam';
      cerrarMenuMovil();
      descartarModales();
      contenido.replaceChildren();
      pantalla.render(contenido, params);
      window.scrollTo(0, 0);
    },
  };
}
