# Prepara una imagen de un jefe para el juego: la achica, la recorta
# centrada al formato que corresponde y la guarda como JPEG, así la app no
# carga imágenes de varios MB.
#
#   powershell -ExecutionPolicy Bypass -File scripts/preparar-imagen-jefe.ps1 <imagen> <id> [carta|retrato|habilidad]
#
# - carta (por defecto): la ilustración completa, 600x800 (3:4), para la
#   carta del menú y la página de información -> public/img/cartas/<id>.jpg
# - retrato: la miniatura redonda de la pelea, 256x256 (el círculo la
#   recorta) -> public/img/jefes/<id>.jpg
# - habilidad: el icono redondo de una habilidad, 128x128
#   -> public/img/habilidades/<id>.jpg
#
# <id> es el del catálogo de jefes (uriel, uriel_uber, hecate...) o, para
# una habilidad, el `imagen` de su sección (uriel_facil, uriel_pasiva...).

param(
    [Parameter(Mandatory = $true)][string]$Origen,
    [Parameter(Mandatory = $true)][string]$Id,
    [ValidateSet('carta', 'retrato', 'habilidad')][string]$Tipo = 'carta'
)

Add-Type -AssemblyName System.Drawing

$FORMATOS = @{
    carta   = @{ Ancho = 600; Alto = 800; Carpeta = 'public/img/cartas' }
    retrato = @{ Ancho = 256; Alto = 256; Carpeta = 'public/img/jefes' }
    habilidad = @{ Ancho = 128; Alto = 128; Carpeta = 'public/img/habilidades' }
}
$CALIDAD = 85

$formato = $FORMATOS[$Tipo]
$ancho = $formato.Ancho
$alto = $formato.Alto

$raiz = Split-Path -Parent $PSScriptRoot
$carpeta = Join-Path $raiz $formato.Carpeta
New-Item -ItemType Directory -Force $carpeta | Out-Null
$destino = Join-Path $carpeta "$Id.jpg"

$imagen = [System.Drawing.Image]::FromFile((Resolve-Path $Origen))

# Recorte centrado al formato de destino.
$escala = [Math]::Max($ancho / $imagen.Width, $alto / $imagen.Height)
$anchoEscalado = $imagen.Width * $escala
$altoEscalado = $imagen.Height * $escala
$x = ($ancho - $anchoEscalado) / 2
$y = ($alto - $altoEscalado) / 2

$lienzo = New-Object System.Drawing.Bitmap $ancho, $alto
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
