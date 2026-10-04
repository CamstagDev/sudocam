// Zoom para los tableros grandes (multi sudoku, Typhon): pellizcar con dos
// dedos en el teléfono, o los botones − / + en cualquier pantalla. Con el
// zoom puesto, el tablero se recorre arrastrando con un dedo (o con la
// barra de desplazamiento en PC).
//
//   activarZoom(contenedorDelTablero);
//
// El zoom solo cambia el ancho del tablero (la variable CSS --zoom, ver
// tablero.css); todo lo demás se ajusta solo porque las celdas se miden
// en relación a ese ancho.

const ZOOM_MINIMO = 1;
const ZOOM_MAXIMO = 3;
const PASO_BOTONES = 0.5;

const limitar = (zoom) => Math.min(ZOOM_MAXIMO, Math.max(ZOOM_MINIMO, zoom));

export function activarZoom(contenedor) {
  contenedor.classList.add('con-zoom');
  let zoom = 1;

  const controles = document.createElement('div');
  controles.className = 'controles-zoom';
  controles.innerHTML = `
    <button type="button" class="icon-btn" data-zoom="-1" aria-label="Alejar">−</button>
    <button type="button" class="icon-btn" data-zoom="1" aria-label="Acercar">+</button>
  `;
  contenedor.before(controles);

  // Cambia el zoom manteniendo en su lugar el punto que estaba bajo
  // (x, y) dentro del contenedor (el centro, si no se indica).
  function aplicar(nuevoZoom, x = contenedor.clientWidth / 2, y = contenedor.clientHeight / 2) {
    const anterior = zoom;
    zoom = limitar(nuevoZoom);
    const factor = zoom / anterior;
    const puntoX = contenedor.scrollLeft + x;
    const puntoY = contenedor.scrollTop + y;
    contenedor.style.setProperty('--zoom', String(zoom));
    contenedor.scrollLeft = puntoX * factor - x;
    contenedor.scrollTop = puntoY * factor - y;
  }

  controles.querySelectorAll('[data-zoom]').forEach((boton) => {
    boton.addEventListener('click', () => aplicar(zoom + Number(boton.dataset.zoom) * PASO_BOTONES));
  });

  // Pellizco: se siguen los dos dedos y el zoom cambia en la misma
  // proporción que la distancia entre ellos.
  const dedos = new Map();
  let distanciaInicial = null;
  let zoomInicial = 1;

  const distancia = () => {
    const [a, b] = [...dedos.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  contenedor.addEventListener('pointerdown', (evento) => {
    if (evento.pointerType !== 'touch') return;
    dedos.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
    if (dedos.size === 2) {
      distanciaInicial = distancia();
      zoomInicial = zoom;
    }
  });

  contenedor.addEventListener('pointermove', (evento) => {
    if (!dedos.has(evento.pointerId)) return;
    dedos.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
    if (dedos.size === 2 && distanciaInicial) {
      const [a, b] = [...dedos.values()];
      const caja = contenedor.getBoundingClientRect();
      aplicar(zoomInicial * (distancia() / distanciaInicial), (a.x + b.x) / 2 - caja.left, (a.y + b.y) / 2 - caja.top);
    }
  });

  const soltar = (evento) => {
    dedos.delete(evento.pointerId);
    if (dedos.size < 2) distanciaInicial = null;
  };
  contenedor.addEventListener('pointerup', soltar);
  contenedor.addEventListener('pointercancel', soltar);
}
