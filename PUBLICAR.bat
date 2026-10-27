@echo off
title Publicar cambios - Estampado Darlin
cd /d "%~dp0"

echo ============================================
echo   Publicando cambios de la pagina...
echo ============================================
echo.

git add .
git commit -m "Actualizo la pagina"
git push

echo.
echo ============================================
echo   LISTO! En 1 minuto la web se actualiza sola.
echo ============================================
echo.
pause
