@echo off
echo ==========================================
echo Iniciando Black Rose Web (Frontend)...
echo ==========================================
cd /d "%~dp0\blackroseweb"
call npm run host
pause