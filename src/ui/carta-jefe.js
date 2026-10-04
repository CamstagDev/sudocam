// Carta de un jefe en el menú. Tres estados:
//  - bloqueado: candado, "???" y la pista de cómo desbloquearlo.
//  - disponible: retrato y nombre; abre la pelea. Lleva un botón ℹ para su
//    información y, si ya se desbloqueó, 💠 para su versión uber.
//  - próximamente: desbloqueado pero todavía no está hecho en esta
//    versión del juego.
//
// Los botones chicos van al lado de la carta, no dentro (un botón no puede
// ir dentro de otro).

import { navegar } from '../router.js';
import { JEFES } from '../game/jefes/catalogo.js';
import { PISTAS_DE_DESBLOQUEO, jefeDesbloqueado } from '../game/jefes/registro.js';

// Ruta de la pelea de cada jefe ya construido.
const RUTAS_DE_PELEA = {
  uriel: 'jefe-uriel',
  hecate: 'jefe-hecate',
  jormungandr: 'jefe-jormungandr',
};

const RESUMEN_DE_PELEA = {
  uriel: 'Llena más casillas que el jefe antes de que complete el tablero',
  hecate: 'Resuelve el tablero en 15 minutos entre ilusiones y engaños',
  jormungandr: 'Resuelve un sudoku difícil mientras la serpiente se lo come',
};

function botonChico({ icono, titulo, alTocar, clase }) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = `icon-btn carta-boton-chico ${clase}`;
  boton.title = titulo;
  boton.setAttribute('aria-label', titulo);
  boton.textContent = icono;
  boton.addEventListener('click', alTocar);
  return boton;
}

export function crearCartaJefe(id) {
  const envoltura = document.createElement('div');
  envoltura.className = 'carta-jefe';
  const jefe = JEFES[id];

  if (!jefeDesbloqueado(id)) {
    envoltura.innerHTML = `
      <div class="game-card bloqueada">
        <span class="game-card-icon">🔒</span>
        <span class="game-card-title">???</span>
        <span class="game-card-desc">${PISTAS_DE_DESBLOQUEO[id]}</span>
      </div>
    `;
    return envoltura;
  }

  const ruta = RUTAS_DE_PELEA[id];
  envoltura.innerHTML = `
    <button type="button" class="game-card ${ruta ? '' : 'bloqueada'}">
      <span class="game-card-icon">${jefe.emoji}</span>
      <span class="game-card-title">Jefe: ${jefe.nombre}</span>
      <span class="game-card-desc">${ruta ? RESUMEN_DE_PELEA[id] : 'Próximamente en esta versión'}</span>
    </button>
  `;
  if (ruta) envoltura.querySelector('.game-card').addEventListener('click', () => navegar(ruta));

  envoltura.appendChild(botonChico({
    icono: 'ℹ',
    titulo: `Información de ${jefe.nombre}`,
    clase: 'carta-boton-info',
    alTocar: () => navegar('jefe', { id }),
  }));

  if (ruta && jefeDesbloqueado(`${id}_uber`)) {
    envoltura.appendChild(botonChico({
      icono: JEFES[`${id}_uber`].emoji,
      titulo: `${jefe.nombre} (Uber)`,
      clase: 'carta-boton-uber',
      alTocar: () => navegar(ruta, { uber: 1 }),
    }));
  }

  return envoltura;
}
