// Muestra una carta flotando junto a un elemento: al pasar el mouse, al
// enfocarlo con el teclado o, en el teléfono, al tocarlo (otro toque en
// cualquier parte la cierra).
//
//   mostrarAlPasar(iconoDeHabilidad, () => crearCartaHabilidad(seccion, { desbloqueada }));
//
// La carta se crea cada vez que se muestra, así siempre está al día. Hay
// una sola carta flotante a la vez para toda la app.

const MARGEN = 16; // distancia mínima a los bordes de la pantalla
const SEPARACION = 8; // entre el elemento y la carta

let flotante = null;
let anclaActual = null;

function ocultar() {
  flotante?.remove();
  flotante = null;
  anclaActual = null;
}

// Debajo del elemento si cabe; si no, arriba. Centrada sobre él pero sin
// salirse de la pantalla.
function posicionar(carta, ancla) {
  const zona = ancla.getBoundingClientRect();
  const { width: ancho, height: alto } = carta.getBoundingClientRect();

  const izquierdaIdeal = zona.left + zona.width / 2 - ancho / 2;
  const izquierda = Math.min(Math.max(izquierdaIdeal, MARGEN), window.innerWidth - ancho - MARGEN);
  const cabeAbajo = zona.bottom + SEPARACION + alto <= window.innerHeight - MARGEN;
  const arriba = cabeAbajo ? zona.bottom + SEPARACION : Math.max(MARGEN, zona.top - SEPARACION - alto);

  carta.style.left = `${izquierda}px`;
  carta.style.top = `${arriba}px`;
}

function mostrar(ancla, crearCarta) {
  ocultar();
  flotante = document.createElement('div');
  flotante.className = 'carta-flotante';
  flotante.setAttribute('role', 'tooltip');
  flotante.appendChild(crearCarta());
  document.body.appendChild(flotante);
  anclaActual = ancla;
  posicionar(flotante, ancla);
}

export function mostrarAlPasar(ancla, crearCarta) {
  ancla.tabIndex = 0;
  ancla.addEventListener('pointerenter', (evento) => {
    if (evento.pointerType === 'mouse') mostrar(ancla, crearCarta);
  });
  ancla.addEventListener('pointerleave', (evento) => {
    if (evento.pointerType === 'mouse' && anclaActual === ancla) ocultar();
  });
  // Solo el foco del teclado: el de un toque ya lo maneja pointerup.
  ancla.addEventListener('focus', () => {
    if (ancla.matches(':focus-visible')) mostrar(ancla, crearCarta);
  });
  ancla.addEventListener('blur', () => {
    if (anclaActual === ancla) ocultar();
  });

  // En el teléfono no hay "pasar el mouse": un toque la abre y la cierra.
  // Los iconos que ya hacen algo al tocarlos (p. ej. Ouroboros) no la usan.
  ancla.addEventListener('pointerup', (evento) => {
    if (evento.pointerType === 'mouse' || ancla.classList.contains('tocable')) return;
    if (anclaActual === ancla) ocultar();
    else mostrar(ancla, crearCarta);
  });
}

// Cualquier toque fuera de la carta y su elemento la cierra, y también
// cambiar de pantalla o desplazarse (la carta quedaría fuera de lugar).
document.addEventListener('pointerdown', (evento) => {
  if (flotante && !flotante.contains(evento.target) && !anclaActual?.contains(evento.target)) ocultar();
});
window.addEventListener('hashchange', ocultar);
window.addEventListener('scroll', ocultar, { capture: true, passive: true });
