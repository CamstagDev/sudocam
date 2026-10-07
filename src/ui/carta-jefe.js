// Carta de un jefe desbloqueado en el menú (los bloqueados no tienen carta:
// ni siquiera se insinúan).
//
// La carta tiene dos caras: el frente es el jefe normal y, si su versión
// uber ya se desbloqueó, el dorso es la uber. El botón chico de la uber no
// empieza la pelea: da vuelta la carta, y tocar la cara que se ve empieza
// la pelea contra ese jefe. El botón ℹ abre la información del que se ve.
//
// Cada cara muestra la ilustración del jefe (ver imagenDeCarta) o, si
// todavía no tiene, su emoji. Un jefe que todavía no está hecho en esta
// versión se ve "próximamente" y no se puede tocar.
//
// Los botones chicos van al lado de las caras, no dentro (un botón no puede
// ir dentro de otro).

import { navegar } from '../router.js';
import { JEFES, imagenDeCarta } from '../game/jefes/catalogo.js';
import { jefeDesbloqueado } from '../game/jefes/registro.js';
import { elegirDificultadDeJefe } from './selector-dificultad-jefe.js';
import { buscarImagenDeJefe } from './imagen-de-jefe.js';

// Ruta de la pelea de cada jefe ya construido (la uber usa la misma, con
// ?uber=1).
const RUTAS_DE_PELEA = {
  uriel: 'jefe-uriel',
  hecate: 'jefe-hecate',
  jormungandr: 'jefe-jormungandr',
  babel: 'jefe-babel',
  typhon: 'jefe-typhon',
};

const RESUMEN_DE_PELEA = {
  uriel: 'Llena más casillas que el jefe antes de que complete el tablero',
  hecate: 'Resuelve el tablero en 15 minutos entre ilusiones y engaños',
  jormungandr: 'Resuelve un sudoku difícil mientras la serpiente se lo come',
  babel: 'Resuelve un sudoku escrito en símbolos que cambian',
  typhon: 'Cuatro tableros en círculo que no paran de girar',
  uriel_uber: 'Cada búsqueda de Uriel apunta a dos cajas a la vez',
  hecate_uber: 'Sus ilusiones ya no parpadean: parecen números reales',
  jormungandr_uber: 'La serpiente devora más números de cada bocado',
  babel_uber: 'Tres alfabetos a la vez, uno distinto en cada caja',
  typhon_uber: 'Cinco tableros en X, todos en extremo, girando sin parar',
};

// Jefes que piden opciones antes de pelear (devuelven null si se cancela).
const OPCIONES_ANTES_DE_PELEAR = {
  babel: async () => {
    const dificultad = await elegirDificultadDeJefe('Babel');
    return dificultad && { dificultad };
  },
};

async function irAPelear(id, ruta, extra = {}) {
  const elegirOpciones = OPCIONES_ANTES_DE_PELEAR[id];
  const opciones = elegirOpciones ? await elegirOpciones() : {};
  if (opciones) navegar(ruta, { ...opciones, ...extra });
}

function botonChico({ clase, alTocar }) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = `icon-btn carta-boton-chico ${clase}`;
  boton.addEventListener('click', alTocar);
  return boton;
}

function rotularBotonChico(boton, { icono, titulo }) {
  boton.textContent = icono;
  boton.title = titulo;
  boton.setAttribute('aria-label', titulo);
}

// Pone la ilustración del jefe de fondo en la cara; sin ilustración, la
// cara se queda con el emoji y el texto.
async function ponerIlustracion(cara, id) {
  const ruta = await buscarImagenDeJefe(id, imagenDeCarta);
  if (!ruta) return;
  // Ruta absoluta: un url() relativo dentro de una variable CSS se resuelve
  // desde la hoja de estilos (dist/assets/) y en el build no encuentra la
  // imagen.
  const absoluta = new URL(ruta, document.baseURI).href;
  cara.style.setProperty('--ilustracion', `url("${absoluta}")`);
  cara.classList.add('con-ilustracion');
}

// Una cara de la carta: el jefe `id` (normal o uber). Si se puede pelear,
// tocarla empieza la pelea.
function crearCara(id, { pelear, clase }) {
  const jefe = JEFES[id];
  const cara = document.createElement('button');
  cara.type = 'button';
  cara.className = `game-card carta-cara ${clase} ${pelear ? '' : 'bloqueada'}`;
  cara.innerHTML = `
    <span class="game-card-icon">${jefe.emoji}</span>
    <span class="carta-cara-texto">
      <span class="game-card-title">Jefe: ${jefe.nombre}</span>
      <span class="game-card-desc">${pelear ? RESUMEN_DE_PELEA[id] : 'Próximamente en esta versión'}</span>
    </span>
  `;
  if (pelear) cara.addEventListener('click', pelear);
  ponerIlustracion(cara, id);
  return cara;
}

export function crearCartaJefe(id) {
  const idUber = `${id}_uber`;
  const ruta = RUTAS_DE_PELEA[id];
  const conUber = Boolean(ruta) && jefeDesbloqueado(idUber);

  const envoltura = document.createElement('div');
  envoltura.className = 'carta-jefe';
  const giro = document.createElement('div');
  giro.className = 'carta-jefe-giro';
  envoltura.appendChild(giro);

  const frente = crearCara(id, { clase: 'carta-frente', pelear: ruta && (() => irAPelear(id, ruta)) });
  giro.appendChild(frente);

  let volteada = false;
  const botonInfo = botonChico({
    clase: 'carta-boton-info',
    alTocar: () => navegar('jefe', { id: volteada ? idUber : id }),
  });
  rotularBotonChico(botonInfo, { icono: 'ℹ', titulo: `Información de ${JEFES[id].nombre}` });
  envoltura.appendChild(botonInfo);

  if (!conUber) return envoltura;

  const dorso = crearCara(idUber, { clase: 'carta-dorso', pelear: () => irAPelear(id, ruta, { uber: 1 }) });
  giro.appendChild(dorso);

  const botonUber = botonChico({ clase: 'carta-boton-uber', alTocar: () => mostrarCara(!volteada) });
  envoltura.appendChild(botonUber);

  // La cara que no se ve queda inerte: no se puede tocar ni enfocar.
  function mostrarCara(uber) {
    volteada = uber;
    envoltura.classList.toggle('volteada', uber);
    frente.inert = uber;
    dorso.inert = !uber;

    const visible = JEFES[uber ? idUber : id];
    const otra = JEFES[uber ? id : idUber];
    rotularBotonChico(botonInfo, { icono: 'ℹ', titulo: `Información de ${visible.nombre}` });
    rotularBotonChico(botonUber, { icono: otra.emoji, titulo: `Dar vuelta: ${otra.nombre}` });
  }

  mostrarCara(false);
  return envoltura;
}
