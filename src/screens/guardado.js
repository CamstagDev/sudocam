// Pantalla "Datos de guardado": resumen del progreso, exportar e importar
// el archivo de guardado, y borrar todo.

import { borrarProgreso, leerTextoDeGuardado, obtenerGuardado, reemplazarGuardado } from '../save/guardado.js';
import { filasDelResumen, resumirGuardado } from '../save/resumen.js';
import { elegirArchivoParaImportar, exportarTexto } from '../save/archivos.js';
import { estamosEnEscritorio } from '../save/almacen-escritorio.js';
import { aplicarTemaGuardado } from '../tema.js';
import { confirmar, mostrarAviso } from '../ui/modal.js';

function tablaResumen(guardado) {
  const filas = filasDelResumen(resumirGuardado(guardado));
  return `
    <dl class="resumen-guardado">
      ${filas.map(([etiqueta, valor]) => `<dt>${etiqueta}</dt><dd>${valor}</dd>`).join('')}
    </dl>
  `;
}

function textoDeResumen(guardado) {
  return filasDelResumen(resumirGuardado(guardado))
    .map(([etiqueta, valor]) => `${etiqueta}: ${valor}`)
    .join('\n');
}

const DONDE_SE_GUARDA = estamosEnEscritorio()
  ? 'Tu progreso se guarda solo en %APPDATA%\\SudoCam\\guardado en este PC.'
  : 'Tu progreso se guarda solo en este navegador. Si borras los datos del navegador, se pierde: exporta una copia de vez en cuando.';

export const pantallaGuardado = {
  titulo: 'Datos de guardado',

  render(contenedor) {
    contenedor.innerHTML = `
      <div class="banner" id="banner"></div>

      <section class="card">
        <h2 class="section-title">Tu progreso</h2>
        <p class="campo-ayuda tarjeta-ayuda">${DONDE_SE_GUARDA}</p>
        <div id="resumen"></div>
      </section>

      <section class="card">
        <h2 class="section-title">Copia de tu guardado</h2>
        <p class="campo-ayuda tarjeta-ayuda">
          Exporta un archivo con todo tu progreso para guardarlo aparte o pasarlo a otro
          dispositivo. Al importar uno, reemplaza el progreso actual (antes se guarda una copia).
        </p>
        <div class="fila-acciones fila-acciones-izquierda">
          <button type="button" class="btn btn-primary" id="btn-exportar">⬇ Exportar guardado</button>
          <button type="button" class="btn btn-secondary" id="btn-importar">⬆ Importar guardado</button>
        </div>
      </section>

      <section class="card zona-peligro">
        <h2 class="section-title">Empezar de cero</h2>
        <p class="campo-ayuda tarjeta-ayuda">Borra todo tu progreso: logros, partidas en pausa, colores y preferencias.</p>
        <button type="button" class="btn btn-peligro" id="btn-borrar">Borrar todo el progreso</button>
      </section>
    `;

    const banner = contenedor.querySelector('#banner');
    const resumen = contenedor.querySelector('#resumen');

    function mostrarMensaje(texto, tipo) {
      banner.textContent = texto;
      banner.className = `banner visible ${tipo}`;
    }

    function dibujarResumen() {
      resumen.innerHTML = tablaResumen(obtenerGuardado());
    }

    async function exportar() {
      const exportado = await exportarTexto(JSON.stringify(obtenerGuardado(), null, 2));
      if (exportado) mostrarMensaje('Guardado exportado.', 'exito');
    }

    async function importar() {
      const texto = await elegirArchivoParaImportar();
      if (texto === null) return;

      let importado;
      try {
        importado = leerTextoDeGuardado(texto);
      } catch (error) {
        mostrarAviso('No se pudo importar', error.message);
        return;
      }

      const seguro = await confirmar({
        titulo: 'Importar guardado',
        mensaje: `Este archivo tiene:\n\n${textoDeResumen(importado)}\n\nReemplazará tu progreso actual. ¿Seguro?`,
        textoConfirmar: 'Importar',
      });
      if (!seguro) return;

      await reemplazarGuardado(importado);
      aplicarTemaGuardado();
      dibujarResumen();
      mostrarMensaje('Guardado importado.', 'exito');
    }

    async function borrarTodo() {
      const seguro = await confirmar({
        titulo: 'Borrar todo el progreso',
        mensaje: 'Se borrarán tus logros, partidas en pausa, colores y preferencias. Esto no se puede deshacer desde el juego. ¿Seguro?',
        textoConfirmar: 'Borrar todo',
        peligroso: true,
      });
      if (!seguro) return;

      await borrarProgreso();
      aplicarTemaGuardado();
      dibujarResumen();
      mostrarMensaje('Progreso borrado. Empiezas de cero.', 'exito');
    }

    contenedor.querySelector('#btn-exportar').addEventListener('click', exportar);
    contenedor.querySelector('#btn-importar').addEventListener('click', importar);
    contenedor.querySelector('#btn-borrar').addEventListener('click', borrarTodo);

    dibujarResumen();
  },
};
