# Cambios de SudoCam

Cada versión publicada tiene su sección. Lo que se va haciendo se anota
en "Sin publicar"; `npm run version:nueva` la convierte en la sección de
la versión nueva (ver scripts/nueva-version.mjs).

El número de versión del guardado (save/formato.js) es aparte: solo
sube cuando cambia la forma del archivo de guardado.

## Sin publicar

- Uriel y Uber Uriel tienen ilustración propia en su carta del menú. Las
  cartas con ilustración muestran solo la imagen (ya trae el nombre del
  jefe), sin texto encima.
- La página de información de un jefe muestra su ilustración completa
  arriba, en vez del retrato redondo (los que todavía no tienen
  ilustración siguen con el retrato).
- Uriel tiene un retrato nuevo para la miniatura redonda de la pelea.
- El botón de la uber ya no empieza la pelea: da vuelta la carta para
  mostrar a la uber, y tocar la cara que se ve empieza la pelea contra
  ese jefe. Se puede ir y volver entre normal y uber; el botón ℹ abre la
  información del que se ve. Vale para todos los jefes (los que todavía
  no tienen ilustración muestran su emoji).
- Nuevo script `scripts/preparar-imagen-jefe.ps1`: achica la imagen de un
  jefe y la guarda como JPEG, como ilustración de carta (600x800, en
  `public/img/cartas/<id>.jpg`) o como retrato (256x256, en
  `public/img/jefes/<id>.jpg`).

## 0.2.0 (2026-10-05)

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
- Nuevo tema Monocromo: solo blanco y negro (números, botones, errores,
  jugadas de los jefes); el único gris es el resaltado de la fila, columna
  y caja de la celda elegida.
- Los números equivocados ahora van subrayados además de en el color de
  error, en todos los temas y tableros, para que se distingan aunque el
  tema no tenga rojo (Monocromo) o no se vean bien los colores.

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
