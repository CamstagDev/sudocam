import './styles/tokens.css';
import './styles/base.css';
import './styles/componentes.css';
import './styles/menu.css';
import './styles/tablero.css';
import { RUTA_INICIO, iniciarRouter, registrarPantalla } from './router.js';
import { crearShell } from './ui/shell.js';
import { pantallaMenu } from './screens/menu.js';
import { pantallaSudoku } from './screens/sudoku.js';
import { pantallaEnConstruccion } from './screens/en-construccion.js';
import { iniciarGuardado } from './save/guardado.js';
import { mostrarAviso } from './ui/modal.js';

registrarPantalla(RUTA_INICIO, pantallaMenu);
registrarPantalla('sudoku', pantallaSudoku);
registrarPantalla('multisudoku', pantallaEnConstruccion('Multi Sudoku', '🧬'));
registrarPantalla('logros', pantallaEnConstruccion('Logros', '🏆'));
registrarPantalla('personalizacion', pantallaEnConstruccion('Personalización', '🎨'));
registrarPantalla('guardado', pantallaEnConstruccion('Datos de guardado', '💾'));

// Primero se carga el guardado (todas las pantallas lo leen), después se
// dibuja la app.
async function arrancar() {
  const aviso = await iniciarGuardado();

  const shell = crearShell(document.getElementById('app'));
  iniciarRouter((ruta, pantalla, params) => shell.mostrarPantalla(ruta, pantalla, params));

  if (aviso) mostrarAviso('Aviso sobre tu guardado', aviso);
}

arrancar();
