<#
Replace Remote Script
Usage (from repo root):
  powershell -ExecutionPolicy Bypass -File .\scripts\replace-remote.ps1 -RemoteUrl "https://github.com/YourUser/Repo.git" -Branch main -CreateRemoteBackup

What it does:
 - Verifica que git esté instalado
 - Añade y commitea todos los cambios locales si no hay commit pendiente con mensaje automático
 - Crea una rama de backup local llamada backup-local-YYYYMMDD-HHMMSS
 - (Opcional) Empuja esa rama backup al remote `origin` para conservar historial remoto
 - Actualiza el remote `origin` si se pasa `-RemoteUrl`
 - Hace fetch y pull --rebase de origin/<branch>
 - Empuja la rama indicada con `--force-with-lease` para reemplazar la rama remota de forma más segura

Notes:
 - No guarda tokens ni contraseñas. Debes disponer de credenciales configuradas en tu máquina (credential helper o SSH)
 - Si tu PowerShell bloquea scripts, ejecuta con `-ExecutionPolicy Bypass` como en el ejemplo.
 - Revisa la salida y confirma antes de aceptar el force push.
#>
param(
    [string]$RemoteUrl = "",
    [string]$Branch = "main",
    [switch]$CreateRemoteBackup
)

function Abort([string]$msg){ Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }

# Check git
try {
    git --version > $null 2>&1
} catch {
    Abort "git no está disponible en esta máquina. Instala Git y vuelve a intentarlo: https://git-scm.com/downloads"
}

# Ensure we're in a git repo
$root = git rev-parse --show-toplevel 2>$null
if (-not $?) { Abort "El directorio actual no parece ser un repo git. Ejecuta esto desde la raíz del proyecto." }
Set-Location $root
Write-Host "Repo root: $root"

# Show brief status
Write-Host "Estado actual (git status):" -ForegroundColor Cyan
git status --short

# Stage and commit if there are changes
$porcelain = git status --porcelain
if ($porcelain) {
    $msg = "Auto-commit: save local changes before remote replace (`$(Get-Date -Format yyyy-MM-dd_HH:mm:ss)` )"
    Write-Host "Se detectaron cambios sin commitear. Haciendo 'git add -A' y commit con mensaje: $msg" -ForegroundColor Yellow
    git add -A
    git commit -m "$msg"
    if (-not $?) { Abort "Error haciendo commit automático. Revisa conflictos y prueba de nuevo." }
} else {
    Write-Host "No hay cambios sin commitear." -ForegroundColor Green
}

# Create backup branch
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$backupBranch = "backup-local-$ts"
git checkout -b $backupBranch
if (-not $?) { Abort "No se pudo crear la rama de backup." }
Write-Host "Rama backup creada: $backupBranch" -ForegroundColor Green

# Push backup to origin if requested
if ($CreateRemoteBackup) {
    Write-Host "Empujando rama de backup a origin..." -ForegroundColor Yellow
    git push -u origin $backupBranch
    if (-not $?) { Write-Host "Advertencia: no se pudo empujar el backup a origin. Continua localmente." -ForegroundColor Magenta }
}

# Return to target branch
git checkout $Branch
if (-not $?) { Abort "No se pudo cambiar a la rama $Branch" }

# Configure remote origin if provided
if ($RemoteUrl -ne "") {
    $existing = git remote get-url origin 2>$null
    if ($?) {
        Write-Host "Remote origin existente: $existing" -ForegroundColor Cyan
        if ($existing -ne $RemoteUrl) {
            Write-Host "Cambiando origin a: $RemoteUrl" -ForegroundColor Yellow
            git remote set-url origin $RemoteUrl
            if (-not $?) { Abort "No se pudo setear la URL del remote origin" }
        } else {
            Write-Host "La URL indicada coincide con origin." -ForegroundColor Green
        }
    } else {
        Write-Host "No existe remote 'origin'. Añadiendo: $RemoteUrl" -ForegroundColor Yellow
        git remote add origin $RemoteUrl
        if (-not $?) { Abort "No se pudo añadir el remote origin" }
    }
}

# Fetch and show remote status
Write-Host "Haciendo fetch de origin..." -ForegroundColor Cyan
git fetch origin

Write-Host "Comparando con origin/$Branch (últimos commits):" -ForegroundColor Cyan
git log --oneline --decorate --graph --all -n 10

# Pull --rebase to incorporate upstream changes
Write-Host "Intentando 'git pull --rebase origin $Branch'" -ForegroundColor Cyan
git pull --rebase origin $Branch
if (-not $?) {
    Write-Host "git pull --rebase falló (posible conflicto). Puedes resolver manualmente o cancelar." -ForegroundColor Red
    Write-Host "Saliendo sin tocar el remoto." -ForegroundColor Red
    exit 1
}

# Confirm force push
Write-Host "Listo para empujar $Branch a origin y reemplazar la rama remota con --force-with-lease." -ForegroundColor Yellow
$yn = Read-Host "Confirmas: empujar y reemplazar origin/$Branch? (yes/no)"
if ($yn -ne 'yes') { Write-Host "Operación cancelada por usuario."; exit 0 }

# Push with force-with-lease
Write-Host "Empujando con --force-with-lease..." -ForegroundColor Cyan
git push origin $Branch --force-with-lease
if (-not $?) {
    Write-Host "Push falló. Si el remoto cambió desde tu último fetch, considera ejecutar nuevamente con backup remoto creado." -ForegroundColor Red
    exit 1
}

Write-Host "Push completado. origin/$Branch reemplazada con tu versión local." -ForegroundColor Green
Write-Host "Rama backup local: $backupBranch" -ForegroundColor Cyan
if ($CreateRemoteBackup) { Write-Host "Backup remoto enviado a origin/$backupBranch" -ForegroundColor Cyan }

Write-Host "Fin." -ForegroundColor Green
