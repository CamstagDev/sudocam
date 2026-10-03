// Pantalla provisional para lo que todavía no está hecho -- se va
// reemplazando por la pantalla real en cada paso del plan.
export function pantallaEnConstruccion(titulo, icono = '🧩') {
  return {
    titulo,
    subtitulo: 'Próximamente',
    render(contenedor) {
      contenedor.innerHTML = `
        <div class="empty-state">
          <p style="font-size: 32px; margin: 0 0 8px;">${icono}</p>
          <p style="margin: 0;">Esta pantalla todavía está en construcción.</p>
        </div>
      `;
    },
  };
}
