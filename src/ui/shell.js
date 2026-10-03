import { RUTA_INICIO, navegar } from '../router.js';

// Cascarón común a todas las pantallas: barra superior (logo + título de
// la pantalla) y el <main> donde cada pantalla se dibuja.
export function crearShell(raiz) {
  raiz.innerHTML = `
    <header class="navbar">
      <div class="navbar-left">
        <a href="#/${RUTA_INICIO}" class="navbar-logo" aria-label="Ir al menú">Sudo<span>Cam</span></a>
        <div class="navbar-title">
          <p class="navbar-titulo" id="navbar-titulo"></p>
          <p class="navbar-sub" id="navbar-sub"></p>
        </div>
      </div>
      <div class="navbar-acciones">
        <button type="button" class="icon-btn hidden" id="btn-volver" title="Volver al menú" aria-label="Volver al menú">←</button>
      </div>
    </header>
    <main class="app-content" id="contenido"></main>
  `;

  const titulo = raiz.querySelector('#navbar-titulo');
  const subtitulo = raiz.querySelector('#navbar-sub');
  const btnVolver = raiz.querySelector('#btn-volver');
  const contenido = raiz.querySelector('#contenido');

  btnVolver.addEventListener('click', () => navegar(RUTA_INICIO));

  return {
    mostrarPantalla(ruta, pantalla) {
      titulo.textContent = pantalla.titulo;
      subtitulo.textContent = pantalla.subtitulo ?? '';
      subtitulo.classList.toggle('hidden', !pantalla.subtitulo);
      btnVolver.classList.toggle('hidden', ruta === RUTA_INICIO);
      document.title = ruta === RUTA_INICIO ? 'SudoCam' : `SudoCam · ${pantalla.titulo}`;
      contenido.replaceChildren();
      pantalla.render(contenido);
      window.scrollTo(0, 0);
    },
  };
}
