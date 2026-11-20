// Preferencias de juego (no visuales). En el guardado, perfil.preferencias
// es null (todo por defecto) o un objeto con algunos de estos campos.

import { modificarGuardado, obtenerGuardado } from './save/guardado.js';

export const CAMPOS_PREFERENCIAS = [
  {
    id: 'resaltarRelacionadas',
    nombre: 'Resaltar fila, columna y caja',
    descripcion: 'Ilumina la fila, la columna y la caja de 3x3 de la celda elegida.',
    porDefecto: true,
  },
  {
    id: 'resaltarIguales',
    nombre: 'Resaltar números iguales',
    descripcion: 'Ilumina las demás celdas con el mismo número que la elegida.',
    porDefecto: true,
  },
  {
    id: 'mostrarCronometro',
    nombre: 'Mostrar cronómetro',
    descripcion: 'Muestra el tiempo que llevas en la partida.',
    porDefecto: true,
  },
  {
    id: 'sobrescribirTemasDeJefes',
    nombre: 'Sobrescribir temas de jefes',
    descripcion: 'En las peleas usa tus colores en vez de los del jefe.',
    porDefecto: false,
    // No se muestra hasta desbloquear algún jefe (no delata que existen).
    soloConJefes: true,
  },
  {
    id: 'vibracion',
    nombre: 'Vibración',
    descripcion: 'El teléfono vibra al equivocarte, al ganar y cuando un jefe ataca.',
    porDefecto: true,
    // Solo se muestra donde hay con qué vibrar (Android, ver vibracion.js).
    soloEnAndroid: true,
  },
];

// Las preferencias guardadas encima de las de por defecto.
export function leerPreferencias() {
  const guardadas = obtenerGuardado().perfil.preferencias ?? {};
  const preferencias = {};
  for (const { id, porDefecto } of CAMPOS_PREFERENCIAS) {
    preferencias[id] = typeof guardadas[id] === 'boolean' ? guardadas[id] : porDefecto;
  }
  return preferencias;
}

export async function guardarPreferencia(id, valor) {
  await modificarGuardado((guardado) => {
    guardado.perfil.preferencias = { ...leerPreferencias(), [id]: valor };
  });
}

export async function restablecerPreferencias() {
  await modificarGuardado((guardado) => {
    guardado.perfil.preferencias = null;
  });
}
