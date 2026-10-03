// Icono redondo de una habilidad de jefe: un anillo que se va llenando
// como un reloj mientras la habilidad se carga, y un destello cuando se
// dispara.
//
//   const icono = crearIconoHabilidad({ emoji: '🔍', nombre: 'Búsqueda fácil' });
//   fila.appendChild(icono.elemento);
//   icono.cargar(0.4);    0 a 1; con animación suave
//   icono.reiniciar();    vuelve a 0 sin animación (se acaba de disparar)
//   icono.destello();
//
// El anillo es un <circle> de SVG cuyo trazo se "destapa" con
// stroke-dashoffset (más nítido que un conic-gradient en algunos
// navegadores).

const RADIO = 19; // en un viewBox de 42x42
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;
const DURACION_MS = 1000;

export function crearIconoHabilidad({ emoji, nombre }) {
  const elemento = document.createElement('div');
  elemento.className = 'icono-habilidad';
  elemento.title = nombre;
  elemento.innerHTML = `
    <svg class="icono-habilidad-anillo" viewBox="0 0 42 42" aria-hidden="true">
      <circle class="icono-habilidad-fondo" cx="21" cy="21" r="${RADIO}" />
      <circle class="icono-habilidad-carga" cx="21" cy="21" r="${RADIO}" />
    </svg>
    <span>${emoji}</span>
  `;
  const trazo = elemento.querySelector('.icono-habilidad-carga');
  trazo.style.strokeDasharray = String(CIRCUNFERENCIA);

  let cargaActual = 0;
  let animacion = null;

  function pintar(carga) {
    cargaActual = carga;
    trazo.style.strokeDashoffset = String(CIRCUNFERENCIA * (1 - carga));
  }

  function cargar(objetivo) {
    cancelAnimationFrame(animacion);
    const desde = cargaActual;
    const hasta = Math.min(1, Math.max(0, objetivo));
    const inicio = performance.now();

    function paso(ahora) {
      const t = Math.min(1, (ahora - inicio) / DURACION_MS);
      pintar(desde + (hasta - desde) * t);
      if (t < 1) animacion = requestAnimationFrame(paso);
    }
    animacion = requestAnimationFrame(paso);
  }

  function reiniciar() {
    cancelAnimationFrame(animacion);
    pintar(0);
  }

  // Se quita y se vuelve a poner la clase para que el destello se repita
  // aunque el anterior no haya terminado.
  function destello() {
    elemento.classList.remove('disparada');
    void elemento.offsetWidth;
    elemento.classList.add('disparada');
  }

  pintar(0);
  return { elemento, cargar, reiniciar, destello };
}
