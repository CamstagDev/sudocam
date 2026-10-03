// Ventana modal sencilla: un panel centrado sobre un fondo oscuro.
// Se cierra con la ×, con Escape o tocando fuera del panel.
//
//   const modal = abrirModal({ titulo: 'Nuevo Sudoku', contenido: elemento, alCerrar });
//   modal.cerrar();

export function abrirModal({ titulo, contenido, alCerrar = () => {} }) {
  const fondo = document.createElement('div');
  fondo.className = 'modal-fondo';
  fondo.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-cabecera">
        <h2></h2>
        <button type="button" class="modal-cerrar" aria-label="Cerrar">&times;</button>
      </div>
    </div>
  `;

  const panel = fondo.querySelector('.modal');
  panel.querySelector('h2').textContent = titulo;
  panel.appendChild(contenido);

  function alPresionarTecla(evento) {
    if (evento.key === 'Escape') cerrar();
  }

  function cerrar() {
    document.removeEventListener('keydown', alPresionarTecla);
    fondo.remove();
    alCerrar();
  }

  fondo.querySelector('.modal-cerrar').addEventListener('click', cerrar);
  fondo.addEventListener('click', (evento) => {
    if (evento.target === fondo) cerrar();
  });
  document.addEventListener('keydown', alPresionarTecla);

  document.body.appendChild(fondo);
  return { cerrar, panel };
}

// Modal de solo lectura con un mensaje y un botón "Entendido".
export function mostrarAviso(titulo, mensaje) {
  const contenido = document.createElement('div');
  contenido.innerHTML = `
    <p class="modal-texto"></p>
    <div class="fila-acciones">
      <button type="button" class="btn btn-primary">Entendido</button>
    </div>
  `;
  contenido.querySelector('.modal-texto').textContent = mensaje;
  const modal = abrirModal({ titulo, contenido });
  contenido.querySelector('button').addEventListener('click', modal.cerrar);
}

// Pregunta sí/no. Resuelve true solo si el jugador confirma.
//
//   if (await confirmar({ titulo: 'Eliminar partida', mensaje: '¿Seguro?', textoConfirmar: 'Eliminar' })) ...
export function confirmar({ titulo, mensaje, textoConfirmar = 'Aceptar', peligroso = false }) {
  return new Promise((resolver) => {
    let respuesta = false;
    const contenido = document.createElement('div');
    contenido.innerHTML = `
      <p class="modal-texto"></p>
      <div class="fila-acciones">
        <button type="button" class="btn btn-secondary" data-respuesta="no">Cancelar</button>
        <button type="button" class="btn ${peligroso ? 'btn-peligro' : 'btn-primary'}" data-respuesta="si"></button>
      </div>
    `;
    contenido.querySelector('.modal-texto').textContent = mensaje;
    contenido.querySelector('[data-respuesta="si"]').textContent = textoConfirmar;

    const modal = abrirModal({ titulo, contenido, alCerrar: () => resolver(respuesta) });
    contenido.querySelectorAll('[data-respuesta]').forEach((boton) => {
      boton.addEventListener('click', () => {
        respuesta = boton.dataset.respuesta === 'si';
        modal.cerrar();
      });
    });
  });
}
