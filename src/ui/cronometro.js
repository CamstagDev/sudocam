// Cronómetro de partida: suma un segundo por tick y avisa para redibujar.
//
//   const cronometro = crearCronometro({ segundosIniciales, alCambiar: (segundos) => ... });
//   cronometro.iniciar(); cronometro.detener(); cronometro.segundos;

export function crearCronometro({ segundosIniciales = 0, alCambiar }) {
  let segundos = segundosIniciales;
  let intervalo = null;

  return {
    get segundos() {
      return segundos;
    },
    iniciar() {
      if (intervalo) return;
      alCambiar(segundos);
      intervalo = setInterval(() => {
        segundos++;
        alCambiar(segundos);
      }, 1000);
    },
    detener() {
      clearInterval(intervalo);
      intervalo = null;
    },
  };
}

// 75 -> "01:15"
export function formatearSegundos(total) {
  const minutos = Math.floor(total / 60);
  const segundos = total % 60;
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}
