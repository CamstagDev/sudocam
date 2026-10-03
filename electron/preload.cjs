// Puente entre la ventana del juego y Electron, como
// window.sudocamEscritorio. Lo único que expone es leer y escribir los
// archivos de guardado (src/save/almacen-escritorio.js) y exportar o
// importar uno con los diálogos del sistema (src/save/archivos.js). El
// juego no tiene ningún otro acceso al disco.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sudocamEscritorio', {
  leer: (nombre) => ipcRenderer.invoke('guardado:leer', nombre),
  escribir: (nombre, texto) => ipcRenderer.invoke('guardado:escribir', nombre, texto),
  exportar: (nombreSugerido, texto) => ipcRenderer.invoke('guardado:exportar', nombreSugerido, texto),
  importar: () => ipcRenderer.invoke('guardado:importar'),
});
