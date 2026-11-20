import './styles/tokens.css';
import './styles/base.css';
import './styles/componentes.css';
import './styles/menu.css';
import './styles/tablero.css';
import './styles/personalizacion.css';
import './styles/logros.css';
import './styles/jefes.css';
import './styles/tutorial.css';
import './styles/duelo.css';
import './styles/estadisticas.css';
import { RUTA_INICIO, iniciarRouter, registrarPantalla } from './router.js';
import { crearShell } from './ui/shell.js';
import { pantallaMenu } from './screens/menu.js';
import { pantallaJefes } from './screens/jefes.js';
import { pantallaSudoku } from './screens/sudoku.js';
import { pantallaMultiSudoku } from './screens/multisudoku.js';
import { pantallaTutorial } from './screens/tutorial.js';
import { pantallaDuelo } from './screens/duelo.js';
import { pantallaJefeInfo } from './screens/jefe-info.js';
import { pantallaUriel } from './screens/jefes/uriel.js';
import { pantallaHecate } from './screens/jefes/hecate.js';
import { pantallaJormungandr } from './screens/jefes/jormungandr.js';
import { pantallaBabel } from './screens/jefes/babel.js';
import { pantallaTyphon } from './screens/jefes/typhon.js';
import { pantallaPersonalizacion } from './screens/personalizacion.js';
import { pantallaLogros } from './screens/logros.js';
import { pantallaEstadisticas } from './screens/estadisticas.js';
import { pantallaGuardado } from './screens/guardado.js';
import { iniciarGuardado } from './save/guardado.js';
import { almacenNavegador } from './save/almacen-navegador.js';
import { almacenEscritorio, estamosEnEscritorio } from './save/almacen-escritorio.js';
import { almacenAndroid, estamosEnAndroid } from './save/almacen-android.js';
import { mostrarAviso } from './ui/modal.js';
import { aplicarTemaDePantalla, aplicarTemaGuardado } from './tema.js';

registrarPantalla(RUTA_INICIO, pantallaMenu);
registrarPantalla('jefes', pantallaJefes);
registrarPantalla('sudoku', pantallaSudoku);
registrarPantalla('multisudoku', pantallaMultiSudoku);
registrarPantalla('tutorial', pantallaTutorial);
registrarPantalla('duelo', pantallaDuelo);
registrarPantalla('jefe', pantallaJefeInfo);
registrarPantalla('jefe-uriel', pantallaUriel);
registrarPantalla('jefe-hecate', pantallaHecate);
registrarPantalla('jefe-jormungandr', pantallaJormungandr);
registrarPantalla('jefe-babel', pantallaBabel);
registrarPantalla('jefe-typhon', pantallaTyphon);
registrarPantalla('logros', pantallaLogros);
registrarPantalla('estadisticas', pantallaEstadisticas);
registrarPantalla('personalizacion', pantallaPersonalizacion);
registrarPantalla('guardado', pantallaGuardado);

// Dónde vive el guardado según dónde corre el juego.
function elegirAlmacen() {
  if (estamosEnAndroid()) return almacenAndroid;
  if (estamosEnEscritorio()) return almacenEscritorio;
  return almacenNavegador;
}

// Primero se carga el guardado (todas las pantallas lo leen), después se
// dibuja la app.
async function arrancar() {
  const aviso = await iniciarGuardado(elegirAlmacen());
  aplicarTemaGuardado();

  const shell = crearShell(document.getElementById('app'));
  // Cada pantalla con sus colores: en una pelea, los del jefe (ver tema.js).
  iniciarRouter((ruta, pantalla, params) => {
    aplicarTemaDePantalla(pantalla, params);
    shell.mostrarPantalla(ruta, pantalla, params);
  });

  if (aviso) mostrarAviso('Aviso sobre tu guardado', aviso);
}

arrancar();
