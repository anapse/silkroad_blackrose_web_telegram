@echo off
echo ==========================================
echo Iniciando Black Rose Backend...
echo ==========================================
cd /d "%~dp0\blackrosebackend"
call npm run dev
pause