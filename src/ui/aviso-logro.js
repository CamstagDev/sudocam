// Aviso flotante "Logro desbloqueado" en la esquina de la pantalla. Si se
// ganan varios a la vez, aparecen uno detrás de otro.
//
//   mostrarLogrosNuevos([{ nombre, icono }, ...]);

const DURACION_MS = 3200;
const SEPARACION_MS = 3500;

function mostrarUno({ nombre, icono }) {
  const aviso = document.createElement('div');
  aviso.className = 'aviso-logro';
  aviso.setAttribute('role', 'status');
  aviso.innerHTML = `
    <span class="aviso-logro-icono"></span>
    <span>
      <span class="aviso-logro-titulo">Logro desbloqueado</span>
      <span class="aviso-logro-nombre"></span>
    </span>
  `;
  aviso.querySelector('.aviso-logro-icono').textContent = icono;
  aviso.querySelector('.aviso-logro-nombre').textContent = nombre;
  document.body.appendChild(aviso);

  // Dos cuadros de espera para que la transición de entrada se vea.
  requestAnimationFrame(() => requestAnimationFrame(() => aviso.classList.add('visible')));

  setTimeout(() => {
    aviso.classList.remove('visible');
    setTimeout(() => aviso.remove(), 400);
  }, DURACION_MS);
}

export function mostrarLogrosNuevos(logros) {
  logros.forEach((logro, i) => setTimeout(() => mostrarUno(logro), i * SEPARACION_MS));
}
