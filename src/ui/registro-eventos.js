// Registro de lo que pasa en una pelea de jefe ("Uriel completó un 4..."),
// con la hora. Los mensajes nuevos quedan arriba.
//
//   const registro = crearRegistroEventos(contenedor);
//   registro.anotar('Uriel completó un 4 en su caja', 'jefe' | 'jugador' | 'neutro');

function horaActual() {
  return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function crearRegistroEventos(contenedor) {
  const lista = document.createElement('ol');
  lista.className = 'registro-eventos';
  lista.setAttribute('aria-live', 'polite');
  lista.innerHTML = '<li class="registro-vacio">Aquí se anota lo que pasa en la pelea.</li>';
  contenedor.appendChild(lista);

  function anotar(mensaje, tipo = 'neutro') {
    lista.querySelector('.registro-vacio')?.remove();
    const linea = document.createElement('li');
    linea.className = `registro-${tipo}`;
    linea.innerHTML = '<time></time> <span></span>';
    linea.querySelector('time').textContent = horaActual();
    linea.querySelector('span').textContent = mensaje;
    lista.prepend(linea);
  }

  return { anotar, elemento: lista };
}
