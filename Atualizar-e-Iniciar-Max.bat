@echo off
chcp 65001 >nul
title Max Stack — atualizar e iniciar
cd /d "%~dp0"

echo [1/4] Parando servidor antigo na porta 3847...
call "%~dp0Parar-Max.bat" >nul 2>&1

echo [2/4] Instalando dependencias (apos git pull)...
call npm install
if errorlevel 1 (
  echo ERRO: npm install falhou.
  pause
  exit /b 1
)

echo [3/4] Iniciando Max Stack (build + servidor)...
echo Aguarde — a primeira vez apos atualizar pode levar ~30s.
start "Max Stack" cmd /k "cd /d %~dp0 && npm start"

echo [4/4] Aguardando http://127.0.0.1:3847 ...
set /a n=0
:wait
timeout /t 2 /nobreak >nul
set /a n+=1
powershell -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3847/api/status' -TimeoutSec 3).StatusCode; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 goto ok
if %n% lss 40 goto wait
echo Servidor ainda nao respondeu. Veja a janela "Max Stack" para erros.
pause
exit /b 1

:ok
start "" "http://127.0.0.1:3847/"
echo Max Stack online.
exit /b 0
