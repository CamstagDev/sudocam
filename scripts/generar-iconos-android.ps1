# Genera los iconos y las pantallas de carga de la app de Android a partir
# de los iconos de public/icons/. Vuelve a correrlo si cambias el icono:
#
#   powershell -ExecutionPolicy Bypass -File scripts/generar-iconos-android.ps1
#
# - ic_launcher / ic_launcher_round: el icono normal, en cada densidad.
# - ic_launcher_foreground: el icono "maskable" (con margen de seguridad),
#   para los iconos adaptables de Android 8+ (el fondo es el color de
#   values/ic_launcher_background.xml).
# - splash.png: fondo oscuro de SudoCam con el icono en el centro, del
#   mismo tamaño que cada pantalla de carga que trae Capacitor.

Add-Type -AssemblyName System.Drawing

$raiz = Split-Path -Parent $PSScriptRoot
$res = Join-Path $raiz 'android/app/src/main/res'
$icono = [System.Drawing.Image]::FromFile((Join-Path $raiz 'public/icons/icon-512.png'))
$iconoMaskable = [System.Drawing.Image]::FromFile((Join-Path $raiz 'public/icons/icon-512-maskable.png'))
$fondo = [System.Drawing.ColorTranslator]::FromHtml('#0d0e13')

function Guardar-Redimensionado($imagen, $ancho, $alto, $ruta, $tamanoIcono = $null) {
    $lienzo = New-Object System.Drawing.Bitmap $ancho, $alto
    $grafico = [System.Drawing.Graphics]::FromImage($lienzo)
    $grafico.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    if ($tamanoIcono) {
        # Pantalla de carga: fondo liso y el icono centrado.
        $grafico.Clear($fondo)
        $x = [int](($ancho - $tamanoIcono) / 2)
        $y = [int](($alto - $tamanoIcono) / 2)
        $grafico.DrawImage($imagen, $x, $y, $tamanoIcono, $tamanoIcono)
    } else {
        $grafico.DrawImage($imagen, 0, 0, $ancho, $alto)
    }
    $grafico.Dispose()
    $lienzo.Save($ruta, [System.Drawing.Imaging.ImageFormat]::Png)
    $lienzo.Dispose()
}

# Tamaño en píxeles de cada densidad: icono de 48 dp y capa adaptable de 108 dp.
$densidades = @{ 'mdpi' = 1; 'hdpi' = 1.5; 'xhdpi' = 2; 'xxhdpi' = 3; 'xxxhdpi' = 4 }
foreach ($densidad in $densidades.Keys) {
    $carpeta = Join-Path $res "mipmap-$densidad"
    $lado = [int](48 * $densidades[$densidad])
    $ladoCapa = [int](108 * $densidades[$densidad])
    Guardar-Redimensionado $icono $lado $lado (Join-Path $carpeta 'ic_launcher.png')
    Guardar-Redimensionado $icono $lado $lado (Join-Path $carpeta 'ic_launcher_round.png')
    Guardar-Redimensionado $iconoMaskable $ladoCapa $ladoCapa (Join-Path $carpeta 'ic_launcher_foreground.png')
}

# Las pantallas de carga conservan el tamaño de las que trae Capacitor.
Get-ChildItem -Path $res -Recurse -Filter 'splash.png' | ForEach-Object {
    $original = [System.Drawing.Image]::FromFile($_.FullName)
    $ancho = $original.Width
    $alto = $original.Height
    $original.Dispose()
    $tamanoIcono = [int]([Math]::Min($ancho, $alto) * 0.3)
    Guardar-Redimensionado $icono $ancho $alto $_.FullName $tamanoIcono
}

$icono.Dispose()
$iconoMaskable.Dispose()
Write-Output 'Iconos y pantallas de carga generados.'
