// Almacén del guardado en la app de Windows: archivos .json de verdad en
// %APPDATA%\SudoCam\guardado\, escritos por Electron (ver electron/main.js).
// Misma interfaz que almacen-navegador.js.

export const almacenEscritorio = {
  leer(nombre) {
    return window.sudocamEscritorio.leer(nombre);
  },
  escribir(nombre, texto) {
    return window.sudocamEscritorio.escribir(nombre, texto);
  },
};

export function estamosEnEscritorio() {
  return typeof window !== 'undefined' && Boolean(window.sudocamEscritorio);
}
