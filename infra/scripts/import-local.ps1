# Script para importar OSM usando osm2pgsql local
# IMPORTANTE: Edite a variável $osm2pgsqlPath com o caminho correto do executável

# Caso você não tenha o osm2pgsql instalado, pode baixar em: https://osm2pgsql.org/doc/install.html
# EDITE AQUI: Caminho para o osm2pgsql.exe
$osm2pgsqlPath = "C:\osm2pgsql\osm2pgsql-bin\osm2pgsql.exe"

# Verificar se existe
if (-not (Test-Path $osm2pgsqlPath)) {
    Write-Host "ERRO: osm2pgsql.exe não encontrado em:" -ForegroundColor Red
    Write-Host $osm2pgsqlPath -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Por favor, edite o script import-local.ps1 e configure o caminho correto do osm2pgsql.exe" -ForegroundColor Cyan
    exit 1
}

Write-Host "=== Importação OSM Local ===" -ForegroundColor Cyan
Write-Host "osm2pgsql: $osm2pgsqlPath" -ForegroundColor Green

$osm2pgsqlDir = Split-Path -Parent $osm2pgsqlPath
$stylePath = Join-Path $osm2pgsqlDir "default.style"

if (-not (Test-Path $stylePath)) {
    $stylePath = Join-Path (Split-Path -Parent $osm2pgsqlDir) "default.style"
}

if (-not (Test-Path $stylePath)) {
    Write-Host "ERRO: Arquivo default.style não encontrado!" -ForegroundColor Red
    Write-Host "Procurado em: $osm2pgsqlDir" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Baixe o arquivo de: https://raw.githubusercontent.com/osm2pgsql-dev/osm2pgsql/master/default.style" -ForegroundColor Cyan
    Write-Host "E salve em: $osm2pgsqlDir\default.style" -ForegroundColor Cyan
    exit 1
}

Write-Host "Style file: $stylePath" -ForegroundColor Green
Write-Host ""

# Configuração
$env:PGPASSWORD = "osm"

# Executar importação com progresso visível
Write-Host "Iniciando importação do Sudeste..." -ForegroundColor Yellow
Write-Host "Pressione Ctrl+C para cancelar a qualquer momento" -ForegroundColor Gray
Write-Host ""

& $osm2pgsqlPath `
    --slim `
    --verbose `
    --cache 2000 `
    --number-processes 4 `
    -d osm `
    -U osm `
    -H localhost `
    -P 5432 `
    -S $stylePath `
    "$PSScriptRoot\..\maps\sudeste-260306.osm.pbf" # Substitua pelo caminho do seu arquivo .osm.pbf

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== Importação concluída com sucesso! ===" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Importação finalizada com código: $LASTEXITCODE" -ForegroundColor Yellow
}
