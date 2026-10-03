// Dónde se escribe el guardado cuando el juego corre en un navegador (y,
// por ahora, en todas partes). Más adelante Windows y Android tendrán su
// propio almacén que escribe un archivo `save.json` de verdad; todos
// cumplen la misma interfaz:
//
//   leer(nombre)            -> Promise<string | null>
//   escribir(nombre, texto) -> Promise<void>
//
// `nombre` distingue el guardado principal ('principal') de sus copias de
// seguridad ('copia', 'antes-de-migrar-v1'...).

const PREFIJO = 'sudocam:';

export const almacenNavegador = {
  async leer(nombre) {
    return localStorage.getItem(PREFIJO + nombre);
  },
  async escribir(nombre, texto) {
    localStorage.setItem(PREFIJO + nombre, texto);
  },
};

// Almacén en memoria, para las pruebas automáticas.
export function crearAlmacenEnMemoria(inicial = {}) {
  const archivos = new Map(Object.entries(inicial));
  return {
    archivos,
    async leer(nombre) {
      return archivos.has(nombre) ? archivos.get(nombre) : null;
    },
    async escribir(nombre, texto) {
      archivos.set(nombre, texto);
    },
  };
}
