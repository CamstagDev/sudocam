import './styles/tokens.css';
import './styles/base.css';
import './styles/componentes.css';
import './styles/menu.css';
import './styles/tablero.css';
import './styles/personalizacion.css';
import './styles/logros.css';
import { RUTA_INICIO, iniciarRouter, registrarPantalla } from './router.js';
import { crearShell } from './ui/shell.js';
import { pantallaMenu } from './screens/menu.js';
import { pantallaSudoku } from './screens/sudoku.js';
import { pantallaPersonalizacion } from './screens/personalizacion.js';
import { pantallaLogros } from './screens/logros.js';
import { pantallaEnConstruccion } from './screens/en-construccion.js';
import { iniciarGuardado } from './save/guardado.js';
import { almacenNavegador } from './save/almacen-navegador.js';
import { almacenEscritorio, estamosEnEscritorio } from './save/almacen-escritorio.js';
import { mostrarAviso } from './ui/modal.js';
import { aplicarTemaGuardado } from './tema.js';

registrarPantalla(RUTA_INICIO, pantallaMenu);
registrarPantalla('sudoku', pantallaSudoku);
registrarPantalla('multisudoku', pantallaEnConstruccion('Multi Sudoku', '🧬'));
registrarPantalla('logros', pantallaLogros);
registrarPantalla('personalizacion', pantallaPersonalizacion);
registrarPantalla('guardado', pantallaEnConstruccion('Datos de guardado', '💾'));

// Dónde vive el guardado según dónde corre el juego.
function elegirAlmacen() {
  return estamosEnEscritorio() ? almacenEscritorio : almacenNavegador;
}

// Primero se carga el guardado (todas las pantallas lo leen), después se
// dibuja la app.
async function arrancar() {
  const aviso = await iniciarGuardado(elegirAlmacen());
  aplicarTemaGuardado();

  const shell = crearShell(document.getElementById('app'));
  iniciarRouter((ruta, pantalla, params) => shell.mostrarPantalla(ruta, pantalla, params));

  if (aviso) mostrarAviso('Aviso sobre tu guardado', aviso);
}

arrancar();
