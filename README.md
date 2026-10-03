# SudoCam

Sudoku con jefes, logros y multi sudoku. Juego 100 % offline: sin servidor,
sin cuentas, todo el progreso en un archivo de guardado JSON que se puede
exportar e importar.

## Plataformas

- **Android** (Google Play), empaquetado con Capacitor.
- **Windows** (instalador), empaquetado con Electron.

Ambas comparten el mismo código del juego (`src/`); cada plataforma solo
aporta un envoltorio delgado y el lugar donde se guarda el archivo de
partida.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Abre el juego en el navegador en http://localhost:5173, con recarga al guardar |
| `npm test` | Corre las pruebas automáticas |
| `npm run escritorio` | Compila y abre la app de Windows |
| `npm run escritorio:dev` | Abre la app de Windows contra `npm run dev` (hay que tenerlo corriendo) |
| `npm run instalador:windows` | Genera `release/SudoCam Setup <versión>.exe` |

## Dónde está cada cosa

```
src/
  game/       reglas del juego, sin nada de pantalla (se pueden probar solas)
  save/       archivo de guardado: formato, migraciones, dónde se escribe
  screens/    una pantalla por archivo (menú, sudoku...)
  ui/         piezas reutilizables (tablero, teclado, modal, cronómetro...)
  styles/     CSS
electron/     la app de Windows (ventana + archivos de guardado)
tests/        pruebas automáticas (Vitest)
```

## Guardado

- En el navegador: almacenamiento local del navegador.
- En Windows: `%APPDATA%\SudoCam\guardado\principal.json` (más `copia.json`,
  la copia de seguridad del último guardado bueno).
