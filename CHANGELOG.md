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
- Nuevo color en Personalización: "Fila, columna y caja", el resaltado de
  la fila, columna y caja de la celda seleccionada (antes un gris fijo).
  Cada tema trae el suyo (rosa suave en Sakura, beige en Papel...) y se
  usa en todos los tableros: sudoku, multi sudoku, jefes y uber. Los
  guardados anteriores toman el de su tema sin migrar nada.
- Nuevo modo Tutorial (en Juegos): un sudoku muy fácil con un globo que
  explica paso a paso las reglas (filas, columnas, cajas) y cuatro técnicas
  con ejemplos sobre el tablero: el que falta en una fila, en una caja, el
  barrido y el candidato único, más las notas. Cada ejemplo resalta las
  celdas que importan y espera el número correcto. Después el jugador
  termina el tablero solo, con una lista de consejos para mejorar al costado
  (debajo en el teléfono). Se puede saltar en cualquier momento.
- Estilo del borde de las tarjetas en Personalización ("Borde de las
  tarjetas"): la línea normal o pétalos de sakura en fila, como una línea
  punteada, del color del acento. Vale para tarjetas, menús y ventanas,
  no para el tablero. Es parte del tema: Sakura trae los pétalos y los
  demás la línea, y elegir un tema lo cambia solo; cambiarlo a mano pasa
  a "Personalizado". Los guardados anteriores toman el de su tema.
- Los pétalos son más grandes (y menos) y todos siguen el contorno en el
  mismo sentido, como un camino alrededor de cada tarjeta.
- Nuevo tema Monocromo: fondo blanco, texto y botones negros, y grises
  para el resaltado, los números fijos y los errores.

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
