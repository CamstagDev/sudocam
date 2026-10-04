// Colores personalizables del juego.
//
// El jugador elige unos pocos colores base (Personalización), a mano o con
// un tema predefinido, y de ellos se derivan las variables CSS que usa el
// resto de la app (ver styles/tokens.css): paneles, bordes, texto
// secundario, fondos translúcidos para los estados del tablero...
//
// Además de los colores, el tema elige el estilo del borde de las
// tarjetas (ver bordes.js).
//
// En el guardado, perfil.tema es null (tema SudoCam) o un objeto con los
// colores en formato #rrggbb y `borde`. Qué tema predefinido está "en uso"
// no se guarda: se deduce comparando los valores (ver temaEnUso).

import { modificarGuardado, obtenerGuardado } from './save/guardado.js';
import { BORDE_POR_DEFECTO, esBordeValido, imagenDeBorde } from './bordes.js';

export const CAMPOS_TEMA = [
  { id: 'fondo', nombre: 'Fondo' },
  { id: 'texto', nombre: 'Texto' },
  { id: 'acento', nombre: 'Botones y selección' },
  { id: 'resaltado', nombre: 'Fila, columna y caja' },
  { id: 'logo', nombre: 'Logo' },
  { id: 'pista', nombre: 'Números fijos (pistas)' },
  { id: 'acierto', nombre: 'Aciertos' },
  { id: 'error', nombre: 'Errores' },
  { id: 'jefe', nombre: 'Jugadas de los jefes' },
];

// Temas listos para elegir. El primero es el de por defecto.
export const TEMAS = [
  {
    id: 'sudocam',
    nombre: 'SudoCam',
    colores: { fondo: '#0d0e13', texto: '#f1f2f6', acento: '#8b7cf6', resaltado: '#23242c', logo: '#a898ff', pista: '#7ca8ff', acierto: '#4fd18a', error: '#ff6b6b', jefe: '#f5a623' },
    borde: 'linea',
  },
  {
    id: 'medianoche',
    nombre: 'Medianoche',
    colores: { fondo: '#0b1220', texto: '#e6edf7', acento: '#3b82f6', resaltado: '#1a2a44', logo: '#60a5fa', pista: '#7dd3fc', acierto: '#34d399', error: '#f87171', jefe: '#fbbf24' },
    borde: 'linea',
  },
  {
    id: 'bosque',
    nombre: 'Bosque',
    colores: { fondo: '#0f1a14', texto: '#e7f2ea', acento: '#22c55e', resaltado: '#1d3326', logo: '#86efac', pista: '#fde68a', acierto: '#4ade80', error: '#f87171', jefe: '#fb923c' },
    borde: 'linea',
  },
  {
    id: 'atardecer',
    nombre: 'Atardecer',
    colores: { fondo: '#1c1017', texto: '#f8e9ee', acento: '#f472b6', resaltado: '#3a1f2c', logo: '#fb7185', pista: '#c4b5fd', acierto: '#6ee7b7', error: '#ef4444', jefe: '#fbbf24' },
    borde: 'linea',
  },
  {
    id: 'sakura',
    nombre: 'Sakura',
    colores: { fondo: '#fbe4ec', texto: '#3a1d2b', acento: '#d6457a', resaltado: '#f6c6d8', logo: '#b8325f', pista: '#6b4fa3', acierto: '#1f8f5a', error: '#d42a2a', jefe: '#c2610f' },
    borde: 'sakura',
  },
  {
    id: 'papel',
    nombre: 'Papel',
    colores: { fondo: '#f5f1e8', texto: '#2b2a27', acento: '#8a5a2b', resaltado: '#e6dcc6', logo: '#6b4423', pista: '#2f5d8a', acierto: '#2e7d32', error: '#c62828', jefe: '#b8590e' },
    borde: 'linea',
  },
  {
    id: 'alto-contraste',
    nombre: 'Alto contraste',
    colores: { fondo: '#000000', texto: '#ffffff', acento: '#ffd400', resaltado: '#403800', logo: '#ffd400', pista: '#00e5ff', acierto: '#00ff6a', error: '#ff3b3b', jefe: '#ff9100' },
    borde: 'linea',
  },
];

const COLORES_POR_DEFECTO = TEMAS[0].colores;
const COLOR_HEX = /^#[0-9a-f]{6}$/i;

/* ---------- Utilidades de color ---------- */

function aRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function aHex({ r, g, b }) {
  const parte = (n) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');
  return `#${parte(r)}${parte(g)}${parte(b)}`;
}

// Mezcla dos colores: proporcion 0 = todo `a`, 1 = todo `b`.
function mezclar(a, b, proporcion) {
  const ca = aRgb(a);
  const cb = aRgb(b);
  return aHex({
    r: ca.r + (cb.r - ca.r) * proporcion,
    g: ca.g + (cb.g - ca.g) * proporcion,
    b: ca.b + (cb.b - ca.b) * proporcion,
  });
}

function translucido(hex, opacidad) {
  const { r, g, b } = aRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacidad})`;
}

function esClaro(hex) {
  const { r, g, b } = aRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 140;
}

// Texto oscuro sobre colores claros y claro sobre oscuros.
function textoLegibleSobre(hex) {
  return esClaro(hex) ? '#0b0d12' : '#f2f3f5';
}

/* ---------- Tema ---------- */

// Todas las variables CSS que salen de los colores base. Los paneles y
// bordes se tiñen con el color del texto (no con blanco fijo), así siguen
// viéndose igual de bien sobre un fondo claro que sobre uno oscuro.
function variablesDelTema({ fondo, texto, acento, resaltado, logo, pista, acierto, error, jefe, borde }) {
  return {
    // Las figuras del borde, en un tono del acento un poco apagado.
    '--borde-figura': imagenDeBorde(borde, mezclar(acento, fondo, 0.25)),

    '--bg': fondo,
    '--text': texto,
    '--text-muted': mezclar(texto, fondo, 0.4),
    '--surface': translucido(texto, 0.04),
    '--surface-strong': translucido(texto, 0.07),
    '--border': translucido(texto, 0.09),
    '--border-strong': translucido(texto, 0.16),
    '--surface-solid': mezclar(fondo, texto, 0.04),
    '--surface-solid-strong': mezclar(fondo, texto, 0.06),

    '--accent': acento,
    '--accent-strong': esClaro(fondo) ? mezclar(acento, texto, 0.2) : mezclar(acento, '#ffffff', 0.2),
    '--accent-contrast': textoLegibleSobre(acento),
    '--logo-color': logo,
    // Fila, columna y caja de la celda seleccionada. Opaco: el color
    // elegido es exactamente el que se ve en el tablero.
    '--related-bg': resaltado,

    '--neutral': pista,
    '--neutral-bg': translucido(pista, 0.12),
    '--neutral-border': translucido(pista, 0.35),
    '--success': acierto,
    '--success-bg': translucido(acierto, 0.12),
    '--success-border': translucido(acierto, 0.35),
    '--error': error,
    '--error-bg': translucido(error, 0.12),
    '--error-border': translucido(error, 0.35),
    '--boss': jefe,
    '--boss-bg': translucido(jefe, 0.16),
    '--boss-border': translucido(jefe, 0.4),
  };
}

// Los valores completos de un tema predefinido: sus colores y su borde.
export function valoresDelTema({ colores, borde }) {
  return { ...colores, borde };
}

// El tema predefinido con estos colores (sin mirar el campo `ignorar`).
function temaConColores(colores, ignorar) {
  return TEMAS.find((tema) => CAMPOS_TEMA.every(({ id }) => id === ignorar || tema.colores[id] === colores[id]));
}

// El tema completo: lo guardado encima de los valores por defecto,
// ignorando lo que no sea válido.
//
// Los guardados de antes de "resaltado" y del borde no los traen: si el
// resto de colores es un tema predefinido se usan los de ese tema; si no,
// un tono sacado del fondo y el texto (parecido al gris que había antes)
// y el borde normal.
export function temaCompleto(tema) {
  const resultado = {};
  for (const { id } of CAMPOS_TEMA) {
    const color = tema?.[id];
    if (COLOR_HEX.test(color ?? '')) resultado[id] = color.toLowerCase();
    else if (id !== 'resaltado') resultado[id] = COLORES_POR_DEFECTO[id];
  }
  resultado.resaltado ??= temaConColores(resultado, 'resaltado')?.colores.resaltado
    ?? mezclar(resultado.fondo, resultado.texto, 0.1);
  resultado.borde = esBordeValido(tema?.borde)
    ? tema.borde
    : temaConColores(resultado)?.borde ?? BORDE_POR_DEFECTO;
  return resultado;
}

// Id del tema predefinido que coincide con estos valores, o
// 'personalizado' si el jugador cambió alguno.
export function temaEnUso(tema) {
  const completo = temaCompleto(tema);
  const coincide = temaConColores(completo);
  return coincide && coincide.borde === completo.borde ? coincide.id : 'personalizado';
}

// Pinta la app con `tema` (puede ser null = tema SudoCam).
export function aplicarTema(tema) {
  const completo = temaCompleto(tema);
  const raiz = document.documentElement;

  for (const [variable, valor] of Object.entries(variablesDelTema(completo))) {
    raiz.style.setProperty(variable, valor);
  }

  // Barras de desplazamiento y controles nativos claros u oscuros según
  // el fondo, y la barra del sistema en Android del color del fondo.
  raiz.style.colorScheme = esClaro(completo.fondo) ? 'light' : 'dark';
  raiz.classList.toggle('con-borde-figura', completo.borde !== BORDE_POR_DEFECTO);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', completo.fondo);
}

export function aplicarTemaGuardado() {
  aplicarTema(obtenerGuardado().perfil.tema);
}

export async function guardarTema(tema) {
  await modificarGuardado((guardado) => {
    guardado.perfil.tema = temaCompleto(tema);
  });
}

export async function restablecerTema() {
  await modificarGuardado((guardado) => {
    guardado.perfil.tema = null;
  });
  aplicarTema(null);
}
