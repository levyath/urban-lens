# Exemplos de consultas aos dados OSM importados
# Execute: .\exemplos-consultas.ps1

$env:PGPASSWORD = "osm"

Write-Host "=== Exemplos de Consultas OSM ===" -ForegroundColor Cyan
Write-Host ""

# 1. Estatísticas gerais
Write-Host "1. Estatísticas gerais:" -ForegroundColor Yellow
docker exec osm-postgis psql -U osm -d osm -c @"
SELECT 
    'Points' as tipo,
    COUNT(*) as total,
    COUNT(DISTINCT amenity) as tipos_unicos
FROM planet_osm_point
WHERE amenity IS NOT NULL
UNION ALL
SELECT 
    'Roads',
    COUNT(*),
    COUNT(DISTINCT highway)
FROM planet_osm_line
WHERE highway IS NOT NULL;
"@

Write-Host ""
Write-Host "2. Top 10 tipos de pontos de interesse:" -ForegroundColor Yellow
docker exec osm-postgis psql -U osm -d osm -c @"
SELECT 
    amenity,
    COUNT(*) as quantidade
FROM planet_osm_point
WHERE amenity IS NOT NULL
GROUP BY amenity
ORDER BY quantidade DESC
LIMIT 10;
"@

Write-Host ""
Write-Host "3. Hospitais (primeiros 10):" -ForegroundColor Yellow
docker exec osm-postgis psql -U osm -d osm -c @"
SELECT 
    name,
    amenity,
    ST_Y(way) as latitude,
    ST_X(way) as longitude
FROM planet_osm_point
WHERE amenity = 'hospital' AND name IS NOT NULL
LIMIT 10;
"@

Write-Host ""
Write-Host "4. Tipos de ruas:" -ForegroundColor Yellow
docker exec osm-postgis psql -U osm -d osm -c @"
SELECT 
    highway as tipo_via,
    COUNT(*) as quantidade,
    pg_size_pretty(SUM(ST_Length(way::geography))::bigint) as extensao_total
FROM planet_osm_line
WHERE highway IS NOT NULL
GROUP BY highway
ORDER BY quantidade DESC
LIMIT 10;
"@

Write-Host ""
Write-Host "=== Mais exemplos ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para consultas personalizadas, use:" -ForegroundColor Green
Write-Host "  docker exec -it osm-postgis psql -U osm -d osm" -ForegroundColor White
Write-Host ""
Write-Host "Exemplos de consultas SQL:" -ForegroundColor Green
Write-Host "  -- Buscar por cidade" -ForegroundColor Gray
Write-Host "  SELECT * FROM planet_osm_point WHERE name LIKE '%São Paulo%' LIMIT 10;" -ForegroundColor Gray
Write-Host ""
Write-Host "  -- Contar escolas" -ForegroundColor Gray
Write-Host "  SELECT COUNT(*) FROM planet_osm_point WHERE amenity = 'school';" -ForegroundColor Gray
Write-Host ""
Write-Host "  -- Buscar restaurantes" -ForegroundColor Gray
Write-Host "  SELECT name FROM planet_osm_point WHERE amenity = 'restaurant' LIMIT 20;" -ForegroundColor Gray
