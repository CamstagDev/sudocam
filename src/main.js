import './styles/tokens.css';
import './styles/base.css';
import { RUTA_INICIO, iniciarRouter, registrarPantalla } from './router.js';
import { crearShell } from './ui/shell.js';
import { pantallaEnConstruccion } from './screens/en-construccion.js';

registrarPantalla(RUTA_INICIO, pantallaEnConstruccion('Menú', '🔢'));

const shell = crearShell(document.getElementById('app'));
iniciarRouter((ruta, pantalla) => shell.mostrarPantalla(ruta, pantalla));
