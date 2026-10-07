// Si hay una pelea de jefe en curso, para pedir confirmación antes de
// abandonarla, se salga como se salga: el botón de rendirse de la barra de
// arriba, el gesto o el botón de "atrás" del teléfono, o cualquier enlace
// (ver antesDeSalir en router.js).
//
//   empezarPelea()        al dibujar la pelea
//   terminarPelea()       al mostrar el resultado (ver resultado-pelea.js)
//   antesDeSalir: confirmarRendicion    en la pantalla de cada jefe

import { confirmar } from './modal.js';

let enCurso = false;

export function empezarPelea() {
  enCurso = true;
}

export function terminarPelea() {
  enCurso = false;
}

// true si se puede salir ya; si hay pelea, una promesa con la respuesta.
export function confirmarRendicion() {
  if (!enCurso) return true;
  return confirmar({
    titulo: '¿Rendirte?',
    mensaje: 'Si sales ahora, pierdes esta pelea.',
    textoConfirmar: 'Rendirme',
    peligroso: true,
  }).then((rendirse) => {
    if (rendirse) enCurso = false;
    return rendirse;
  });
}
