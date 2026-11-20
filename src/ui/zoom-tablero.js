// Zoom para los tableros grandes (multi sudoku, Typhon): pellizcar con dos
// dedos en el teléfono, o los botones − / + en cualquier pantalla; el botón
// ↺ vuelve al tamaño normal. Con el zoom puesto, el tablero se recorre
// arrastrando con un dedo (o con la barra de desplazamiento en PC).
//
//   activarZoom(contenedorDelTablero);
//
// El zoom solo cambia el ancho del tablero (la variable CSS --zoom, ver
// tablero.css); todo lo demás se ajusta solo porque las celdas se miden
// en relación a ese ancho.

export const ZOOM_MINIMO = 1;
export const ZOOM_MAXIMO = 4;
const PASO_BOTONES = 0.5;

// Después de un pellizco, el dedo que se levanta último no debe contar
// como un toque sobre la celda que quedó debajo.
const PAUSA_TRAS_PELLIZCO_MS = 350;

export const limitarZoom = (zoom) => Math.min(ZOOM_MAXIMO, Math.max(ZOOM_MINIMO, zoom));

// El zoom de un pellizco cambia en la misma proporción que la distancia
// entre los dos dedos.
export function zoomDelPellizco(zoomInicial, distanciaInicial, distanciaActual) {
  if (!distanciaInicial) return limitarZoom(zoomInicial);
  return limitarZoom(zoomInicial * (distanciaActual / distanciaInicial));
}

// Desplazamiento nuevo para que el punto que estaba en `posicion` (medida
// desde el borde visible del contenedor) siga en el mismo lugar tras
// multiplicar el tamaño del tablero por `factor`.
export function desplazamientoTrasZoom(desplazamiento, posicion, factor) {
  return Math.max(0, (desplazamiento + posicion) * factor - posicion);
}

export function activarZoom(contenedor) {
  contenedor.classList.add('con-zoom');
  let zoom = 1;

  const controles = document.createElement('div');
  controles.className = 'controles-zoom';
  controles.innerHTML = `
    <button type="button" class="icon-btn" data-zoom="-1" aria-label="Alejar">−</button>
    <button type="button" class="icon-btn" data-zoom="1" aria-label="Acercar">+</button>
    <button type="button" class="icon-btn" data-zoom-normal aria-label="Volver al tamaño normal" title="Tamaño normal">↺</button>
  `;
  contenedor.before(controles);
  const btnNormal = controles.querySelector('[data-zoom-normal]');

  // Cambia el zoom manteniendo en su lugar el punto que estaba bajo
  // (x, y) dentro del contenedor (el centro, si no se indica).
  function aplicar(nuevoZoom, x = contenedor.clientWidth / 2, y = contenedor.clientHeight / 2) {
    const factor = limitarZoom(nuevoZoom) / zoom;
    zoom = limitarZoom(nuevoZoom);
    contenedor.style.setProperty('--zoom', String(zoom));
    contenedor.scrollLeft = desplazamientoTrasZoom(contenedor.scrollLeft, x, factor);
    contenedor.scrollTop = desplazamientoTrasZoom(contenedor.scrollTop, y, factor);
    btnNormal.disabled = zoom === ZOOM_MINIMO;
  }
  aplicar(1);

  controles.querySelectorAll('[data-zoom]').forEach((boton) => {
    boton.addEventListener('click', () => aplicar(zoom + Number(boton.dataset.zoom) * PASO_BOTONES));
  });
  btnNormal.addEventListener('click', () => aplicar(ZOOM_MINIMO));

  activarPellizco(contenedor, () => zoom, aplicar);
}

// Pellizco con dos dedos. Se usan eventos táctiles (y no de puntero)
// porque el navegador cancela los punteros apenas empieza a desplazar el
// contenedor con un dedo; aquí, en cambio, con dos dedos se le quita el
// gesto al navegador (preventDefault) y el zoom lo maneja este archivo.
// Un solo dedo sigue desplazando el tablero como siempre.
function activarPellizco(contenedor, zoomActual, aplicar) {
  let distanciaInicial = null;
  let zoomInicial = 1;
  let finDelUltimoPellizco = 0;

  const distancia = ([a, b]) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

  contenedor.addEventListener('touchstart', (evento) => {
    if (evento.touches.length !== 2) return;
    distanciaInicial = distancia(evento.touches);
    zoomInicial = zoomActual();
  }, { passive: true });

  contenedor.addEventListener('touchmove', (evento) => {
    if (evento.touches.length !== 2 || !distanciaInicial) return;
    evento.preventDefault();
    const [a, b] = evento.touches;
    const caja = contenedor.getBoundingClientRect();
    aplicar(
      zoomDelPellizco(zoomInicial, distanciaInicial, distancia(evento.touches)),
      (a.clientX + b.clientX) / 2 - caja.left,
      (a.clientY + b.clientY) / 2 - caja.top,
    );
  }, { passive: false });

  const soltar = (evento) => {
    if (distanciaInicial && evento.touches.length < 2) {
      distanciaInicial = null;
      finDelUltimoPellizco = Date.now();
    }
  };
  contenedor.addEventListener('touchend', soltar);
  contenedor.addEventListener('touchcancel', soltar);

  // Se ataja en la fase de captura, antes de que llegue a la celda.
  contenedor.addEventListener('click', (evento) => {
    if (Date.now() - finDelUltimoPellizco < PAUSA_TRAS_PELLIZCO_MS) {
      evento.stopPropagation();
      evento.preventDefault();
    }
  }, true);
}
