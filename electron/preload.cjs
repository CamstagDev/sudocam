// Puente entre la ventana del juego y Electron. Lo único que expone es
// leer y escribir archivos de guardado, como window.sudocamEscritorio
// (lo usa src/save/almacen-escritorio.js). El juego no tiene ningún otro
// acceso al disco.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sudocamEscritorio', {
  leer: (nombre) => ipcRenderer.invoke('guardado:leer', nombre),
  escribir: (nombre, texto) => ipcRenderer.invoke('guardado:escribir', nombre, texto),
});
