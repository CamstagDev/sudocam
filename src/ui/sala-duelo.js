// La sala del Duelo, antes de empezar: crear un duelo (eligiendo la
// dificultad) y esperar a que alguien se una, o unirse a uno de los que
// hay cerca. Cuando los dos teléfonos se conectan, avisa con la conexión
// y el papel de cada uno; de ahí en adelante sigue screens/duelo.js.
//
//   const sala = crearSalaDuelo(contenedor, {
//     transporte,                                   ver game/duelo/transporte.js
//     alConectarse: ({ conexion, rol, dificultad }) => ...,
//   });
//   sala.destruir();    deja de anunciarse y de buscar

import { DIFICULTADES } from '../game/sudoku/dificultades.js';
import { DIFICULTADES_DUELO, DIFICULTAD_DUELO_POR_DEFECTO } from '../game/duelo/reglas.js';
import { esTransporteDePrueba } from '../game/duelo/transporte.js';

// Letras que no se confunden entre sí (sin I, O, 0, 1).
const LETRAS_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function nuevoCodigo() {
  return Array.from({ length: 4 }, () => LETRAS_CODIGO[Math.floor(Math.random() * LETRAS_CODIGO.length)]).join('');
}

const chipDificultad = (id) => `
  <button type="button" class="chip" data-dificultad="${id}">${DIFICULTADES[id].nombre}</button>
`;

const AVISO_DE_PRUEBA = `
  <p class="aviso-prueba">
    Modo de prueba: abre SudoCam en otra pestaña o ventana de este navegador
    para jugar un duelo contra ti mismo.
  </p>
`;

export function crearSalaDuelo(contenedor, { transporte, alConectarse }) {
  const sala = document.createElement('div');
  sala.className = 'sala-duelo';
  sala.innerHTML = `
    ${esTransporteDePrueba(transporte) ? AVISO_DE_PRUEBA : ''}
    <p class="banner error" data-id="error"></p>

    <section class="card" data-id="crear">
      <h2 class="section-title">Crear un duelo</h2>
      <p class="campo-ayuda tarjeta-ayuda">
        Los dos llenan el mismo sudoku: cada casilla es de quien ponga primero
        el número correcto. Gana quien se anote más.
      </p>
      <div class="chip-picker">${DIFICULTADES_DUELO.map(chipDificultad).join('')}</div>
      <div class="fila-acciones fila-acciones-izquierda">
        <button type="button" class="btn btn-primary" data-id="crear-duelo">Crear duelo</button>
      </div>
    </section>

    <section class="card hidden" data-id="esperando">
      <h2 class="section-title">Esperando rival…</h2>
      <p class="codigo-duelo" data-id="codigo"></p>
      <p class="campo-ayuda tarjeta-ayuda">
        Tu rival tiene que ver este mismo código en su lista de duelos.
      </p>
      <div class="fila-acciones fila-acciones-izquierda">
        <button type="button" class="btn btn-secondary" data-id="cancelar">Cancelar</button>
      </div>
    </section>

    <section class="card" data-id="unirse">
      <h2 class="section-title">Unirse a un duelo</h2>
      <div class="lista-duelos" data-id="lista"></div>
    </section>
  `;
  contenedor.appendChild(sala);

  const parte = (id) => sala.querySelector(`[data-id="${id}"]`);
  const chips = [...sala.querySelectorAll('[data-dificultad]')];
  let dificultad = DIFICULTAD_DUELO_POR_DEFECTO;
  let dejarDeEsperar = null;
  let dejarDeBuscar = null;
  let uniendose = false;

  /* ---------- Errores del teléfono ---------- */

  // Lo que le falta al teléfono para conectarse (permisos, Bluetooth...):
  // se avisa arriba y la sala vuelve a como estaba, para reintentar.
  function mostrarError(mensaje) {
    parte('error').textContent = mensaje;
    parte('error').classList.add('visible');
  }

  function ocultarError() {
    parte('error').classList.remove('visible');
  }

  /* ---------- Crear y esperar ---------- */

  function marcarDificultad() {
    chips.forEach((chip) => chip.classList.toggle('activo', chip.dataset.dificultad === dificultad));
  }

  function esperarRival() {
    ocultarError();
    const codigo = nuevoCodigo();
    parte('codigo').textContent = codigo;
    parte('crear').classList.add('hidden');
    parte('unirse').classList.add('hidden');
    parte('esperando').classList.remove('hidden');
    detenerBusqueda(); // mientras espera, no se une a otros

    dejarDeEsperar = transporte.esperarRival(
      { codigo },
      (conexion) => {
        dejarDeEsperar = null;
        alConectarse({ conexion, rol: 'anfitrion', dificultad });
      },
      (mensaje) => {
        cancelarEspera();
        mostrarError(mensaje);
      },
    );
  }

  function cancelarEspera() {
    dejarDeEsperar?.();
    dejarDeEsperar = null;
    parte('esperando').classList.add('hidden');
    parte('crear').classList.remove('hidden');
    parte('unirse').classList.remove('hidden');
    buscar();
  }

  /* ---------- Buscar y unirse ---------- */

  // Si el teléfono no puede buscar, la lista lo dice y deja reintentar.
  function busquedaFallida(mensaje) {
    detenerBusqueda();
    mostrarError(mensaje);
    parte('lista').innerHTML = `
      <p class="empty-state">No se están buscando duelos.</p>
      <button type="button" class="btn btn-secondary btn-sm" data-id="reintentar">Buscar otra vez</button>
    `;
    parte('reintentar').addEventListener('click', () => {
      ocultarError();
      buscar();
    });
  }

  function dibujarLista(duelos) {
    const lista = parte('lista');
    if (duelos.length === 0) {
      lista.innerHTML = '<p class="empty-state">Buscando duelos cerca…</p>';
      return;
    }
    lista.innerHTML = duelos.map(({ id, codigo }) => `
      <div class="duelo-encontrado">
        <span class="codigo-duelo">${codigo}</span>
        <button type="button" class="btn btn-primary btn-sm" data-unirse="${id}">Unirse</button>
      </div>
    `).join('');
    lista.querySelectorAll('[data-unirse]').forEach((boton) => {
      boton.addEventListener('click', () => unirse(boton.dataset.unirse, boton));
    });
  }

  function buscar() {
    if (!dejarDeBuscar) dejarDeBuscar = transporte.buscarDuelos(dibujarLista, busquedaFallida);
  }

  function detenerBusqueda() {
    dejarDeBuscar?.();
    dejarDeBuscar = null;
  }

  async function unirse(id, boton) {
    if (uniendose) return;
    uniendose = true;
    boton.disabled = true;
    boton.textContent = 'Uniéndote…';
    try {
      const conexion = await transporte.unirse(id);
      detenerBusqueda();
      alConectarse({ conexion, rol: 'invitado' });
    } catch (error) {
      boton.textContent = error.message;
    } finally {
      uniendose = false;
    }
  }

  /* ---------- Arranque ---------- */

  chips.forEach((chip) => chip.addEventListener('click', () => {
    dificultad = chip.dataset.dificultad;
    marcarDificultad();
  }));
  parte('crear-duelo').addEventListener('click', esperarRival);
  parte('cancelar').addEventListener('click', cancelarEspera);
  marcarDificultad();
  buscar();

  return {
    destruir() {
      dejarDeEsperar?.();
      detenerBusqueda();
      sala.remove();
    },
  };
}
