// SudoCam para Windows (Electron).
//
// Electron es solo un marco: abre una ventana que muestra el mismo juego
// que corre en el navegador (la carpeta dist/ que genera `vite build`). Lo
// único que agrega es dónde vive el archivo de guardado: en vez del
// almacenamiento del navegador, archivos .json de verdad en
//   %APPDATA%\SudoCam\guardado\
//
//   npm run escritorio        build + abre la ventana
//   npm run escritorio:dev    abre la ventana contra el servidor de Vite
//                             (npm run dev), con recarga al guardar

import { app, BrowserWindow, Menu, ipcMain, shell } from 'electron';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const carpetaElectron = path.dirname(fileURLToPath(import.meta.url));
const MODO_DESARROLLO = process.argv.includes('--dev');
const URL_DESARROLLO = 'http://localhost:5173';

app.setName('SudoCam');

/* ---------- Archivos de guardado ---------- */

// 'principal', 'copia', 'antes-de-migrar-v1'... (ver src/save/guardado.js)
const NOMBRE_VALIDO = /^[a-z0-9-]+$/;

function rutaDeGuardado(nombre) {
  if (!NOMBRE_VALIDO.test(nombre)) throw new Error(`Nombre de guardado inválido: ${nombre}`);
  return path.join(app.getPath('userData'), 'guardado', `${nombre}.json`);
}

async function leerGuardado(nombre) {
  try {
    return await readFile(rutaDeGuardado(nombre), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null; // todavía no existe
    throw error;
  }
}

// Se escribe primero un archivo temporal y después se renombra: si el
// juego se cierra a mitad de la escritura, el guardado anterior queda
// intacto en vez de quedar a medio escribir.
async function escribirGuardado(nombre, texto) {
  const ruta = rutaDeGuardado(nombre);
  await mkdir(path.dirname(ruta), { recursive: true });
  await writeFile(`${ruta}.tmp`, texto, 'utf8');
  await rename(`${ruta}.tmp`, ruta);
}

ipcMain.handle('guardado:leer', (_evento, nombre) => leerGuardado(nombre));
ipcMain.handle('guardado:escribir', (_evento, nombre, texto) => escribirGuardado(nombre, texto));

/* ---------- Ventana ---------- */

function crearVentana() {
  const ventana = new BrowserWindow({
    width: 1100,
    height: 860,
    minWidth: 380,
    minHeight: 600,
    backgroundColor: '#0d0e13',
    title: 'SudoCam',
    icon: path.join(carpetaElectron, '..', 'dist', 'icons', 'icon-512.png'),
    webPreferences: {
      preload: path.join(carpetaElectron, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  // Cualquier enlace externo se abre en el navegador, nunca dentro del juego.
  ventana.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (MODO_DESARROLLO) {
    ventana.loadURL(URL_DESARROLLO);
  } else {
    ventana.loadFile(path.join(carpetaElectron, '..', 'dist', 'index.html'));
  }
}

// Una sola ventana a la vez: dos copias del juego abiertas escribirían el
// mismo guardado y una pisaría a la otra.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [ventana] = BrowserWindow.getAllWindows();
    if (ventana) {
      if (ventana.isMinimized()) ventana.restore();
      ventana.focus();
    }
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null); // sin la barra Archivo / Editar / Ver
    crearVentana();
  });

  app.on('window-all-closed', () => app.quit());
}
