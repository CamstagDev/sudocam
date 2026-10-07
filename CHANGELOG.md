# Cambios de SudoCam

Cada versión publicada tiene su sección. Lo que se va haciendo se anota
en "Sin publicar"; `npm run version:nueva` la convierte en la sección de
la versión nueva (ver scripts/nueva-version.mjs).

El número de versión del guardado (save/formato.js) es aparte: solo
sube cuando cambia la forma del archivo de guardado.

## Sin publicar

- Typhon y Uber Typhon quedan al nivel de los demás jefes: ilustración en
  su carta, retratos de pelea, iconos para Amalgamación y los dos Caos
  (con su carta en la pelea y en la página de información), historia y
  textos de ambientación. Su antigua sección "Caos a la derecha / Caos a
  la izquierda" se separa en dos, que se desbloquean con lo mismo que
  antes, y la uber suma la carta de Padre de los monstruos.
- Temas de Typhon (negro y plata fría) y Uber Typhon (negro profundo y
  blanco), con los bordes de las tarjetas del color del jefe. En la pelea
  contra Uber Typhon las líneas y los números brillan.
- Uber Typhon ya no telegrafía nada: iconos silenciosos y sin registro de
  eventos. Ya ninguna uber muestra indicadores.
- `scripts/preparar-imagen-jefe.ps1` puede recortar desde arriba
  (opción "arriba"), para no cortar el título de una carta más alta que 3:4.
- Babel y Uber Babel quedan al nivel de los demás jefes: ilustración en
  su carta, retratos de pelea, iconos para &%?#, La lengua evoluciona y
  Torre de Babel (con su carta en la pelea y en la página de
  información), historia y textos de ambientación.
- Temas de Babel (piedra negra y dorado claro) y Uber Babel (neón cian,
  magenta y dorado, que también tiñen sus tres alfabetos), con los bordes
  de las tarjetas del color del jefe. En la pelea contra Uber Babel las
  líneas y los símbolos brillan.
- Uber Babel ya no telegrafía nada: iconos silenciosos y sin registro de
  eventos, como las demás uber.
- En las peleas con tema de jefe, los bordes de las tarjetas (la cabecera
  del jefe, el tablero y lo demás) toman el color del jefe. El tema de
  Uriel pasa a ser naranja, como las luces de su ilustración.
- Jörmungandr: líneas de las cajas todavía más gruesas (y más en su uber),
  sin que las columnas de al lado queden más angostas, y algunas pistas
  aparecen torcidas (más en la uber), para mostrar su caos.
- Estilos de pelea: en la pelea contra Uber Uriel y Uber Hecate las líneas
  de las cajas y los números brillan; contra Jörmungandr las líneas y los
  números son más gruesos, y contra su uber las líneas todavía más. Solo
  se ven con el tema del jefe. Los amarillos del tema de Uriel van un poco
  más hacia el naranja.
- Temas de jefes: Uriel (grises de piedra y dorados), Hecate (morados),
  Jörmungandr (azul profundo con turquesa brillante) y Uber Jörmungandr
  (rojos). En cada pelea se usa el tema del jefe (las uber sin tema propio
  usan el de su versión normal). En Personalización, el tema de cada jefe
  se puede elegir para toda la app después de vencerlo una vez, y la nueva
  preferencia "Sobrescribir temas de jefes" (apagada por defecto) hace que
  las peleas usen tus propios colores. Esa preferencia no aparece hasta
  desbloquear algún jefe.
- Jörmungandr y Uber Jörmungandr tienen ilustración en su carta, retratos de pelea para la normal y la uber, e iconos para Hambre,
  Glotonería y Ouroboros, con su carta en la pelea y en la página de
  información. En la pelea, Hambre y Glotonería son dos iconos: se ve el
  de la fase en la que está. Su antigua sección de fase 2 se separa en
  "Glotonería" y "Ouroboros", que se desbloquean con lo mismo que antes.
- Uber Jörmungandr ya no telegrafía nada, como Uber Uriel y Uber Hecate:
  sus iconos se ven todos desde el principio pero sin carga, destellos ni
  el contador del vientre, y no hay registro de eventos.
- Jörmungandr tiene historia, y los textos de sus habilidades, su secreto
  y su versión uber pasan a ser de ambientación.
- Hecate tiene historia: su descripción cuenta quién es la de las tres
  caras. Los textos de sus habilidades, su secreto y su versión uber pasan
  a ser de ambientación, y en la pelea arriba sale una frase corta en vez
  de la historia.
- Hecate y Uber Hecate tienen ilustración propia en su carta, su retrato
  de la pelea e iconos para sus cuatro habilidades, iguales en la pelea y
  en su página de información (con su carta al pasar el mouse o tocar). Su
  antigua sección de fase 2 se separa en dos: "Maldición de pesadilla" y
  "Aullido paralizante" (que actúa toda la pelea, no solo en fase 2); se
  desbloquean con lo mismo que antes, así que Uber Hecate pide lo mismo.
- Uber Uriel tiene su propio retrato para la miniatura redonda de la pelea
  (antes usaba el de Uriel).
- Uriel se mueve antes: pasa a fase 2 con el 25 % del tablero lleno (antes
  la mitad), "123..." va cada 10 s (5 s en la uber) y "3x3x3" cada 20 s
  (15 s en la uber). Su pasiva "Predecible..." ahora prueba las dos
  búsquedas en la caja del error, así que también se nota en fase 1.
- Nuevo color en Personalización: "Tus números", los que escribes en el
  tablero, aparte del color del texto (por ejemplo, texto negro y números
  rosados). Cada tema trae el suyo igual a su texto, y los guardados
  anteriores lo toman del texto sin migrar nada.
- Para desarrollo: `docs/fichas-tecnicas-jefes.txt`, la ficha técnica de
  cada jefe (tiempos, fases, desbloqueos y cómo funciona cada habilidad).

## 0.3.0 (2026-10-07)

- Uriel y Uber Uriel tienen ilustración propia en su carta del menú. Las
  cartas con ilustración muestran solo la imagen (ya trae el nombre del
  jefe), sin texto encima.
- La página de información de un jefe muestra su ilustración completa
  arriba, en vez del retrato redondo (los que todavía no tienen
  ilustración siguen con el retrato).
- Uriel tiene un retrato nuevo para la miniatura redonda de la pelea.
- Las habilidades de Uriel tienen nombre e icono propios, iguales en la
  pelea y en su página de información: "123..." (antes Búsqueda fácil),
  "3x3x3" (antes Búsqueda por descarte) y su pasiva "Predecible..."
  (antes Purga del Débil), que ahora también tiene su sección en la
  página de información (se ve con la primera victoria). Los textos de
  esas secciones pasan a ser de ambientación: insinúan cómo funciona cada
  habilidad sin explicarla paso a paso.
- Uriel tiene historia: su descripción cuenta de dónde salió la máquina de
  patrones. Su secreto también pasa a ser de ambientación.
- Nueva cabecera de las peleas: el retrato del jefe va a la izquierda, tan
  alto como la tarjeta, y nombre, fase, habilidades y marcador a su
  derecha (en el teléfono el retrato ocupa a lo sumo un tercio del ancho).
- Uber Uriel y Uber Hecate ahora muestran los iconos de sus habilidades,
  todos desde el principio, pero sin ningún indicador: ni carga, ni
  destellos, ni cambios. Se ve el dibujo, no cuándo van a atacar.
- Nueva carta de habilidad: icono, nombre y texto de una habilidad. La
  página de información del jefe es ahora su ilustración y su historia
  con esas cartas apiladas debajo, y en la pelea, pasar el mouse (o tocar,
  en el teléfono) por el icono de una habilidad muestra su carta flotando.
  Mientras la habilidad no se haya investigado, la carta sale bloqueada,
  igual que en la página de información.
- El botón de la uber ya no empieza la pelea: da vuelta la carta para
  mostrar a la uber, y tocar la cara que se ve empieza la pelea contra
  ese jefe. Se puede ir y volver entre normal y uber; el botón ℹ abre la
  información del que se ve. Vale para todos los jefes (los que todavía
  no tienen ilustración muestran su emoji).
- Nuevo script `scripts/preparar-imagen-jefe.ps1`: achica la imagen de un
  jefe y la guarda como JPEG, como ilustración de carta (600x800, en
  `public/img/cartas/<id>.jpg`), como retrato (256x256, en
  `public/img/jefes/<id>.jpg`) o como icono de habilidad (128x128, en
  `public/img/habilidades/<id>.jpg`).

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
