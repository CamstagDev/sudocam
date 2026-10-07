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
import { leerPreferencias } from './preferencias.js';

export const CAMPOS_TEMA = [
  { id: 'fondo', nombre: 'Fondo' },
  { id: 'texto', nombre: 'Texto' },
  { id: 'acento', nombre: 'Botones y selección' },
  { id: 'resaltado', nombre: 'Fila, columna y caja' },
  { id: 'logo', nombre: 'Logo' },
  { id: 'pista', nombre: 'Números fijos (pistas)' },
  { id: 'numeros', nombre: 'Tus números' },
  { id: 'acierto', nombre: 'Aciertos' },
  { id: 'error', nombre: 'Errores' },
  { id: 'jefe', nombre: 'Jugadas de los jefes' },
];

// Temas listos para elegir. El primero es el de por defecto.
export const TEMAS = [
  {
    id: 'sudocam',
    nombre: 'SudoCam',
    colores: { fondo: '#0d0e13', texto: '#f1f2f6', numeros: '#f1f2f6', acento: '#8b7cf6', resaltado: '#23242c', logo: '#a898ff', pista: '#7ca8ff', acierto: '#4fd18a', error: '#ff6b6b', jefe: '#f5a623' },
    borde: 'linea',
  },
  {
    id: 'medianoche',
    nombre: 'Medianoche',
    colores: { fondo: '#0b1220', texto: '#e6edf7', numeros: '#e6edf7', acento: '#3b82f6', resaltado: '#1a2a44', logo: '#60a5fa', pista: '#7dd3fc', acierto: '#34d399', error: '#f87171', jefe: '#fbbf24' },
    borde: 'linea',
  },
  {
    id: 'bosque',
    nombre: 'Bosque',
    colores: { fondo: '#0f1a14', texto: '#e7f2ea', numeros: '#e7f2ea', acento: '#22c55e', resaltado: '#1d3326', logo: '#86efac', pista: '#fde68a', acierto: '#4ade80', error: '#f87171', jefe: '#fb923c' },
    borde: 'linea',
  },
  {
    id: 'atardecer',
    nombre: 'Atardecer',
    colores: { fondo: '#1c1017', texto: '#f8e9ee', numeros: '#f8e9ee', acento: '#f472b6', resaltado: '#3a1f2c', logo: '#fb7185', pista: '#c4b5fd', acierto: '#6ee7b7', error: '#ef4444', jefe: '#fbbf24' },
    borde: 'linea',
  },
  {
    id: 'sakura',
    nombre: 'Sakura',
    colores: { fondo: '#fbe4ec', texto: '#3a1d2b', numeros: '#3a1d2b', acento: '#d6457a', resaltado: '#f6c6d8', logo: '#b8325f', pista: '#6b4fa3', acierto: '#1f8f5a', error: '#d42a2a', jefe: '#c2610f' },
    borde: 'sakura',
  },
  {
    id: 'papel',
    nombre: 'Papel',
    colores: { fondo: '#f5f1e8', texto: '#2b2a27', numeros: '#2b2a27', acento: '#8a5a2b', resaltado: '#e6dcc6', logo: '#6b4423', pista: '#2f5d8a', acierto: '#2e7d32', error: '#c62828', jefe: '#b8590e' },
    borde: 'linea',
  },
  {
    id: 'monocromo',
    nombre: 'Monocromo',
    colores: { fondo: '#ffffff', texto: '#000000', numeros: '#000000', acento: '#000000', resaltado: '#e3e3e3', logo: '#000000', pista: '#000000', acierto: '#000000', error: '#000000', jefe: '#000000' },
    borde: 'linea',
  },
  {
    id: 'alto-contraste',
    nombre: 'Alto contraste',
    colores: { fondo: '#000000', texto: '#ffffff', numeros: '#ffffff', acento: '#ffd400', resaltado: '#403800', logo: '#ffd400', pista: '#00e5ff', acierto: '#00ff6a', error: '#ff3b3b', jefe: '#ff9100' },
    borde: 'linea',
  },
];

// Temas de los jefes, sacados de sus ilustraciones. En una pelea se usa el
// del jefe (salvo que el jugador active "Sobrescribir temas de jefes"), y
// en Personalización se pueden elegir para toda la app después de vencer a
// ese jefe una vez. Los uber sin tema propio usan el de su versión normal.
export const TEMAS_DE_JEFES = [
  {
    id: 'uriel',
    nombre: 'Uriel',
    jefe: 'uriel',
    // Grises oscuros de piedra y el naranja ámbar de sus luces; las pistas
    // con el durazno claro de sus números encendidos, y sus jugadas en un
    // naranja más rojizo para que no se confundan con ellas.
    colores: { fondo: '#141416', texto: '#f2ece4', numeros: '#f2ece4', acento: '#ff8a1e', resaltado: '#2b241d', logo: '#ffa040', pista: '#ffc58a', acierto: '#8fd694', error: '#ff4d6a', jefe: '#ff5a14' },
    borde: 'linea',
  },
  {
    id: 'hecate',
    nombre: 'Hecate',
    jefe: 'hecate',
    // El morado de sus lunas y sus visiones.
    colores: { fondo: '#120c1c', texto: '#ece4f7', numeros: '#ece4f7', acento: '#a855f7', resaltado: '#2a1d3d', logo: '#c084fc', pista: '#d8b4fe', acierto: '#5eead4', error: '#fb7185', jefe: '#e879f9' },
    borde: 'linea',
  },
  {
    id: 'jormungandr',
    nombre: 'Jörmungandr',
    jefe: 'jormungandr',
    // Azul de mar profundo, menos oscuro, con el brillo turquesa de sus escamas.
    colores: { fondo: '#16222c', texto: '#e2eef2', numeros: '#e2eef2', acento: '#22d3ee', resaltado: '#22394b', logo: '#5eead4', pista: '#7dd3fc', acierto: '#4ade80', error: '#f87171', jefe: '#00e5ff' },
    borde: 'linea',
  },
  {
    id: 'jormungandr-uber',
    nombre: 'Uber Jörmungandr',
    jefe: 'jormungandr_uber',
    // La misma serpiente en rojo: brasas y eclipse.
    colores: { fondo: '#1c1213', texto: '#f3e6e6', numeros: '#f3e6e6', acento: '#ef4444', resaltado: '#3a2224', logo: '#ff6b6b', pista: '#fca5a5', acierto: '#4ade80', error: '#fbbf24', jefe: '#ff3b30' },
    borde: 'linea',
  },
];

// Estilo extra del tablero en la pelea contra cada jefe, aparte de los
// colores (ver "Estilos de pelea" en styles/jefes.css). Solo en la pelea y
// solo con el tema del jefe; no viaja con el tema si se elige para la app.
const ESTILOS_DE_PELEA = {
  uriel_uber: 'brillo', // líneas y números que brillan
  hecate_uber: 'brillo',
  jormungandr: 'grueso', // líneas y números más gruesos, pistas torcidas
  jormungandr_uber: 'muy-grueso',
};

// Todos los temas que se pueden reconocer como "en uso".
const TODOS_LOS_TEMAS = [...TEMAS, ...TEMAS_DE_JEFES];

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
function variablesDelTema({ fondo, texto, acento, resaltado, logo, pista, numeros, acierto, error, jefe, borde }) {
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

    // Los números que escribe el jugador en el tablero (aparte del texto).
    '--player-number': numeros,

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

// El tema predefinido con estos colores (sin mirar los campos de `ignorar`).
function temaConColores(colores, ignorar = []) {
  return TODOS_LOS_TEMAS.find((tema) => CAMPOS_TEMA.every(({ id }) => ignorar.includes(id) || tema.colores[id] === colores[id]));
}

// Colores que los guardados viejos no traen, y cómo sacarlos de los demás
// si el tema no es uno predefinido.
const COLORES_NUEVOS = {
  resaltado: (colores) => mezclar(colores.fondo, colores.texto, 0.1), // parecido al gris de antes
  numeros: (colores) => colores.texto, // antes eran del color del texto
};

// El tema completo: lo guardado encima de los valores por defecto,
// ignorando lo que no sea válido.
//
// Los guardados viejos pueden no traer los colores nuevos ("resaltado",
// "numeros") ni el borde: si el resto de colores es un tema predefinido se
// usan los de ese tema; si no, los de COLORES_NUEVOS y el borde normal.
export function temaCompleto(tema) {
  const resultado = {};
  const faltan = [];
  for (const { id } of CAMPOS_TEMA) {
    const color = tema?.[id];
    if (COLOR_HEX.test(color ?? '')) resultado[id] = color.toLowerCase();
    else if (COLORES_NUEVOS[id]) faltan.push(id);
    else resultado[id] = COLORES_POR_DEFECTO[id];
  }
  const predefinido = faltan.length > 0 ? temaConColores(resultado, faltan) : null;
  for (const id of faltan) resultado[id] = predefinido?.colores[id] ?? COLORES_NUEVOS[id](resultado);
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

/* ---------- Temas de jefes ---------- */

// El tema de la pelea contra `idJefe` (normal o uber), o null si no tiene.
export function temaDeJefe(idJefe) {
  const normal = idJefe.replace(/_uber$/, '');
  return TEMAS_DE_JEFES.find(({ jefe }) => jefe === idJefe)
    ?? TEMAS_DE_JEFES.find(({ jefe }) => jefe === normal)
    ?? null;
}

// Los temas de jefes que el jugador ya puede elegir: los de los jefes que
// venció al menos una vez.
export function temasDeJefesDisponibles(guardado = obtenerGuardado()) {
  return TEMAS_DE_JEFES.filter(({ jefe }) => (guardado.jefes[jefe]?.victorias ?? 0) > 0);
}

// El tema que toca en una pantalla: en una pelea (la pantalla dice contra
// qué jefe con `jefe(params)`), el del jefe, salvo que el jugador prefiera
// sus propios colores; en el resto, el suyo.
export function aplicarTemaDePantalla(pantalla, params) {
  const idJefe = pantalla.jefe?.(params);
  const delJefe = idJefe && !leerPreferencias().sobrescribirTemasDeJefes ? temaDeJefe(idJefe) : null;
  aplicarTema(delJefe ? valoresDelTema(delJefe) : obtenerGuardado().perfil.tema);

  // data-tema-de-jefe: los bordes de las tarjetas toman el color del jefe,
  // para que se note que es su pantalla (ver styles/jefes.css).
  const raiz = document.documentElement;
  if (delJefe) raiz.dataset.temaDeJefe = delJefe.id;
  else delete raiz.dataset.temaDeJefe;

  const estilo = delJefe ? ESTILOS_DE_PELEA[idJefe] : null;
  if (estilo) raiz.dataset.estiloPelea = estilo;
  else delete raiz.dataset.estiloPelea;
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
