@echo off
rem Doble clic para abrir SudoCam en modo desarrollo: prende el servidor
rem local (npm run dev) y abre el navegador en http://localhost:5173.
rem Si el servidor ya esta prendido, solo abre el navegador.
rem Para apagar el servidor, cierra esta ventana.

title SudoCam - servidor local
cd /d "%~dp0"

netstat -ano | findstr /R /C:":5173 .*LISTENING" >nul
if not errorlevel 1 (
  echo SudoCam ya estaba prendido. Abriendo el navegador...
  start "" http://localhost:5173
  exit /b
)

if not exist node_modules (
  echo Instalando las dependencias por primera vez, puede tardar un poco...
  call npm install || goto fallo
)

echo Prendiendo SudoCam en http://localhost:5173 ...
echo Para apagarlo, cierra esta ventana.
echo.
call npm run dev -- --open || goto fallo
exit /b

:fallo
echo.
echo Algo salio mal: revisa el mensaje de arriba.
pause
