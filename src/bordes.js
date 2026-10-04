// Estilos del borde de las tarjetas, menús y ventanas (nunca del
// tablero). Es parte del tema (ver tema.js): cada tema predefinido trae
// el suyo y el jugador puede cambiarlo en Personalización.
//
// "Línea" es el borde normal. Los demás repiten una figura pequeña a lo
// largo del borde, como una línea punteada: se dibuja un SVG de 3x3
// casillas con una figura cada una, y CSS lo reparte con border-image
// (ver .con-borde-figura en styles/base.css, cuyo corte de 24 tiene que
// coincidir con TAMANO_CASILLA). Las 4 esquinas y los 4 lados toman una
// casilla cada uno; la del centro no se usa.

export const BORDE_POR_DEFECTO = 'linea';

// Cada casilla deja aire alrededor de su figura: es el espacio entre un
// pétalo y el siguiente.
const TAMANO_CASILLA = 24;
const ESCALA_FIGURA = 1.5; // la figura se dibuja en 12x12 y se agranda a 18x18
const MARGEN_FIGURA = (TAMANO_CASILLA - 12 * ESCALA_FIGURA) / 2;

// Un pétalo de sakura dentro de un cuadro de 12x12: la muesca arriba y la
// punta hacia abajo.
const PETALO = 'M6 11.2C2.4 9 1.6 5 3.6 1.6L6 3.4l2.4-1.8C10.4 5 9.6 9 6 11.2Z';

// Hacia dónde mira la punta en cada casilla (grados, 0 = abajo), para que
// los pétalos sigan el contorno en el sentido de las agujas del reloj:
// arriba van a la derecha, a la derecha bajan, abajo van a la izquierda
// y a la izquierda suben. Las esquinas giran a medio camino.
const GIROS_PETALOS = [
  -135, -90, -45, // esquina, lado de arriba, esquina
  180, 0, 0, //      lado izquierdo, (centro, no se usa), lado derecho
  135, 90, 45, //    esquina, lado de abajo, esquina
];

function svgDePetalos(color) {
  const petalos = GIROS_PETALOS.map((giro, i) => {
    const x = (i % 3) * TAMANO_CASILLA + MARGEN_FIGURA;
    const y = Math.floor(i / 3) * TAMANO_CASILLA + MARGEN_FIGURA;
    return `<path d="${PETALO}" transform="translate(${x} ${y}) scale(${ESCALA_FIGURA}) rotate(${giro} 6 6)"/>`;
  });
  const lado = TAMANO_CASILLA * 3;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" fill="${color}">${petalos.join('')}</svg>`;
}

export const BORDES = {
  linea: { nombre: 'Línea' },
  sakura: { nombre: 'Pétalos de sakura', dibujar: svgDePetalos },
};

export function esBordeValido(id) {
  return Object.hasOwn(BORDES, id);
}

// Valor para la variable CSS --borde-figura: la imagen del borde pintada
// de `color`, o 'none' si el borde es una línea normal.
export function imagenDeBorde(id, color) {
  const { dibujar } = BORDES[id] ?? {};
  if (!dibujar) return 'none';
  return `url("data:image/svg+xml,${encodeURIComponent(dibujar(color))}")`;
}
