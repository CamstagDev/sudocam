// Busca una imagen de un jefe (su retrato o la ilustración de su carta).
// Las imágenes son opcionales: basta con poner el archivo en public/img
// para que aparezca, sin tocar código.
//
//   const ruta = await buscarImagenDeJefe('uriel_uber', imagenDeCarta);
//   // ruta de la imagen, o null si no hay ninguna
//
// Un uber sin imagen propia usa la de su versión normal.

import { JEFES } from '../game/jefes/catalogo.js';

function existe(ruta) {
  return new Promise((resolver) => {
    const imagen = new Image();
    imagen.addEventListener('load', () => resolver(true));
    imagen.addEventListener('error', () => resolver(false));
    imagen.src = ruta;
  });
}

export async function buscarImagenDeJefe(id, rutaDe) {
  const candidatos = [id, JEFES[id]?.normal].filter(Boolean);
  for (const candidato of candidatos) {
    if (await existe(rutaDe(candidato))) return rutaDe(candidato);
  }
  return null;
}
