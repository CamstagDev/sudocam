// Carrusel de los juegos del modo Clásico, para el teléfono (donde tres
// cartas en una fila quedan muy chicas): la carta elegida al medio y, a cada
// lado, la mitad de la anterior y de la siguiente (entre las dos ocupan lo
// que una carta). Tocar la del medio abre el juego; tocar una de los lados,
// o deslizar el dedo, la trae al medio. Da la vuelta.
//
//   contenedor.appendChild(crearCarruselJuegos(JUEGOS, {
//     crearCarta: (juego) => elemento,   la carta de un juego (sin eventos)
//     alElegir: (juego) => ...,          se tocó la carta del medio
//   }));

const DESLIZAMIENTO_MINIMO = 40; // px para que un deslizamiento cuente

export function crearCarruselJuegos(juegos, { crearCarta, alElegir }) {
  const carrusel = document.createElement('div');
  carrusel.className = 'carrusel-juegos';
  let actual = 0;

  const indice = (paso) => (actual + paso + juegos.length) % juegos.length;

  function dibujar() {
    const lugares = [
      { paso: -1, clase: 'anterior' },
      { paso: 0, clase: 'actual' },
      { paso: 1, clase: 'siguiente' },
    ];
    carrusel.replaceChildren(...lugares.map(({ paso, clase }) => {
      const juego = juegos[indice(paso)];
      const carta = crearCarta(juego);
      carta.classList.add('carrusel-juegos-carta', clase);
      carta.addEventListener('click', () => {
        if (paso === 0) alElegir(juego);
        else mover(paso);
      });
      return carta;
    }));
  }

  function mover(paso) {
    actual = indice(paso);
    dibujar();
  }

  let inicioToque = null;
  carrusel.addEventListener('touchstart', (evento) => {
    inicioToque = evento.touches[0].clientX;
  }, { passive: true });
  carrusel.addEventListener('touchend', (evento) => {
    if (inicioToque === null) return;
    const recorrido = evento.changedTouches[0].clientX - inicioToque;
    inicioToque = null;
    if (Math.abs(recorrido) >= DESLIZAMIENTO_MINIMO) mover(recorrido < 0 ? 1 : -1);
  });

  dibujar();
  return carrusel;
}
