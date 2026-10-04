# Cambios de SudoCam

Cada versión publicada tiene su sección. Lo que se va haciendo se anota
en "Sin publicar"; `npm run version:nueva` la convierte en la sección de
la versión nueva (ver scripts/nueva-version.mjs).

El número de versión del guardado (save/formato.js) es aparte: solo
sube cuando cambia la forma del archivo de guardado.

## Sin publicar

- Los jefes bloqueados ya no se insinúan en ninguna parte: no tienen carta
  en el menú (la sección "Jefes" no aparece hasta desbloquear el primero),
  sus logros no se ven ni cuentan en los totales, y el resumen del
  guardado y el color de los jefes en Personalización esperan al primer
  jefe. Vale también para los uber, Typhon incluido. Lo único que sigue
  adelantando cuántos jefes hay es el logro "Cazador de jefes".

## 0.1.0 (2026-10-04)

Primera versión del juego reconstruido, 100 % offline.

- Sudoku 9x9 (fácil, medio, difícil y personalizado) con notas, errores
  según la dificultad, pausa y hasta 3 partidas guardadas.
- Multi Sudoku de 2 a 5 tableros, generado en segundo plano y con zoom.
- Los cinco jefes (Uriel, Hecate, Jörmungandr, Babel, Typhon) y sus
  versiones uber, con su página de información.
- 24 logros, personalización con 7 temas y colores propios, preferencias.
- Guardado en un archivo JSON con copia de seguridad, migraciones,
  exportar e importar.
- App de Windows (Electron) y de Android (Capacitor).
- Cada versión etiquetada genera sola el instalador de Windows y el APK de
  Android, y los publica en GitHub Releases.
