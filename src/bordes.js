// Estilos del borde de las tarjetas, menús y ventanas (nunca del
// tablero). Es parte del tema (ver tema.js): cada tema predefinido trae
// el suyo y el jugador puede cambiarlo en Personalización.
//
// "Línea" es el borde normal. Los demás repiten una figura pequeña a lo
// largo del borde, como una línea punteada: se dibuja un SVG de 3x3
// casillas con una figura cada una, y CSS lo reparte con border-image
// (ver .con-borde-figura en styles/base.css, cuyo corte de 18 tiene que
// coincidir con TAMANO_CASILLA). Las 4 esquinas y los 4 lados toman una
// casilla cada uno; la del centro no se usa.

export const BORDE_POR_DEFECTO = 'linea';

// Cada casilla deja aire alrededor de su figura de 12x12: es el espacio
// entre un pétalo y el siguiente.
const TAMANO_CASILLA = 18;
const MARGEN_FIGURA = (TAMANO_CASILLA - 12) / 2;

// Un pétalo de sakura dentro de un cuadro de 12x12, con la muesca arriba.
const PETALO = 'M6 11.2C2.4 9 1.6 5 3.6 1.6L6 3.4l2.4-1.8C10.4 5 9.6 9 6 11.2Z';

// Cada pétalo un poco girado, para que no parezcan sellos idénticos.
const GIROS_PETALOS = [-30, 20, -10, 35, 0, -25, 15, -35, 25];

function svgDePetalos(color) {
  const petalos = GIROS_PETALOS.map((giro, i) => {
    const x = (i % 3) * TAMANO_CASILLA + MARGEN_FIGURA;
    const y = Math.floor(i / 3) * TAMANO_CASILLA + MARGEN_FIGURA;
    return `<path d="${PETALO}" transform="translate(${x} ${y}) rotate(${giro} 6 6)"/>`;
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
