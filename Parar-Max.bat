@echo off
chcp 65001 >nul
echo Encerrando Max Stack na porta 3847...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3847" ^| findstr "LISTENING"') do (
  if not "%%a"=="4" taskkill /F /PID %%a >nul 2>&1
)
echo Porta 3847 liberada (exceto reserva do sistema PID 4).
timeout /t 2 >nul
