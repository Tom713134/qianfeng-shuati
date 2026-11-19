@echo off
cd /d "%~dp0"
if exist "%~dp0打开前锋刷题.vbs" (
  start "" wscript //nologo "%~dp0打开前锋刷题.vbs"
) else if exist "%~dp0打开刷题.vbs" (
  start "" wscript //nologo "%~dp0打开刷题.vbs"
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0server.ps1"
)
exit
