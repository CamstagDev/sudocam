# Prepara la ilustración de la carta de un jefe para el menú: la achica a
# 600x800 (3:4, el formato de las cartas) y la guarda como JPEG en
# public/img/cartas/<id>.jpg. Así la app no carga imágenes de varios MB.
#
#   powershell -ExecutionPolicy Bypass -File scripts/preparar-carta-jefe.ps1 <imagen> <id>
#
# <id> es el del catálogo de jefes: uriel, uriel_uber, hecate...
# Si la imagen no es 3:4, se recorta centrada.

param(
    [Parameter(Mandatory = $true)][string]$Origen,
    [Parameter(Mandatory = $true)][string]$Id
)

Add-Type -AssemblyName System.Drawing

$ANCHO = 600
$ALTO = 800
$CALIDAD = 85

$raiz = Split-Path -Parent $PSScriptRoot
$carpeta = Join-Path $raiz 'public/img/cartas'
New-Item -ItemType Directory -Force $carpeta | Out-Null
$destino = Join-Path $carpeta "$Id.jpg"

$imagen = [System.Drawing.Image]::FromFile((Resolve-Path $Origen))

# Recorte centrado al formato 3:4.
$escala = [Math]::Max($ANCHO / $imagen.Width, $ALTO / $imagen.Height)
$anchoEscalado = $imagen.Width * $escala
$altoEscalado = $imagen.Height * $escala
$x = ($ANCHO - $anchoEscalado) / 2
$y = ($ALTO - $altoEscalado) / 2

$lienzo = New-Object System.Drawing.Bitmap $ANCHO, $ALTO
$grafico = [System.Drawing.Graphics]::FromImage($lienzo)
$grafico.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$grafico.DrawImage($imagen, [float]$x, [float]$y, [float]$anchoEscalado, [float]$altoEscalado)

$codificador = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$parametros = New-Object System.Drawing.Imaging.EncoderParameters 1
$parametros.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]$CALIDAD)
$lienzo.Save($destino, $codificador, $parametros)

$grafico.Dispose()
$lienzo.Dispose()
$imagen.Dispose()

Write-Output "Lista: $destino"
