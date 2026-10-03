// Colores personalizables del juego.
//
// El jugador elige unos pocos colores base (Personalización) y de cada uno
// se derivan las variables CSS que usa el resto de la app (ver
// styles/tokens.css): versiones más claras para los paneles, fondos
// translúcidos para los estados del tablero, etc.
//
// En el guardado, perfil.tema es null (colores por defecto) o un objeto
// con algunos de estos campos en formato #rrggbb.

import { modificarGuardado, obtenerGuardado } from './save/guardado.js';

export const CAMPOS_TEMA = [
  { id: 'fondo', nombre: 'Color principal (fondo)', porDefecto: '#0d0e13' },
  { id: 'acento', nombre: 'Botones y selección', porDefecto: '#8b7cf6' },
  { id: 'logo', nombre: 'Logo', porDefecto: '#a898ff' },
  { id: 'pista', nombre: 'Números fijos (pistas)', porDefecto: '#7ca8ff' },
  { id: 'acierto', nombre: 'Aciertos', porDefecto: '#4fd18a' },
  { id: 'error', nombre: 'Errores', porDefecto: '#ff6b6b' },
  { id: 'jefe', nombre: 'Jugadas de los jefes', porDefecto: '#f5a623' },
];

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

// Mezcla el color hacia blanco: proporcion 0 = igual, 1 = blanco.
function aclarar(hex, proporcion) {
  const { r, g, b } = aRgb(hex);
  return aHex({
    r: r + (255 - r) * proporcion,
    g: g + (255 - g) * proporcion,
    b: b + (255 - b) * proporcion,
  });
}

function translucido(hex, opacidad) {
  const { r, g, b } = aRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacidad})`;
}

// Texto oscuro sobre colores claros y claro sobre oscuros.
function textoLegibleSobre(hex) {
  const { r, g, b } = aRgb(hex);
  const luminancia = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminancia > 140 ? '#0b0d12' : '#f2f3f5';
}

/* ---------- Tema ---------- */

// Qué variables CSS sale de cada color base.
function variablesDe(campo, color) {
  switch (campo) {
    case 'fondo':
      return {
        '--bg': color,
        '--surface-solid': aclarar(color, 0.03),
        '--surface-solid-strong': aclarar(color, 0.06),
      };
    case 'acento':
      return {
        '--accent': color,
        '--accent-strong': aclarar(color, 0.2),
        '--accent-contrast': textoLegibleSobre(color),
      };
    case 'logo':
      return { '--logo-color': color };
    case 'pista':
      return { '--neutral': color, '--neutral-bg': translucido(color, 0.12), '--neutral-border': translucido(color, 0.35) };
    case 'acierto':
      return { '--success': color, '--success-bg': translucido(color, 0.12), '--success-border': translucido(color, 0.35) };
    case 'error':
      return { '--error': color, '--error-bg': translucido(color, 0.12), '--error-border': translucido(color, 0.35) };
    case 'jefe':
      return { '--boss': color, '--boss-bg': translucido(color, 0.16), '--boss-border': translucido(color, 0.4) };
    default:
      return {};
  }
}

// El tema completo: lo guardado encima de los colores por defecto,
// ignorando cualquier valor que no sea un color válido.
export function temaCompleto(tema) {
  const resultado = {};
  for (const { id, porDefecto } of CAMPOS_TEMA) {
    const color = tema?.[id];
    resultado[id] = COLOR_HEX.test(color ?? '') ? color.toLowerCase() : porDefecto;
  }
  return resultado;
}

// Pinta la app con `tema` (puede ser null = colores por defecto).
export function aplicarTema(tema) {
  const raiz = document.documentElement.style;
  const completo = temaCompleto(tema);

  for (const [campo, color] of Object.entries(completo)) {
    for (const [variable, valor] of Object.entries(variablesDe(campo, color))) {
      raiz.setProperty(variable, valor);
    }
  }

  // El color de la barra del sistema en Android sigue al fondo.
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
