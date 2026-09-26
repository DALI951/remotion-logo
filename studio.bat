@echo off
REM Live preview only. Rendering happens on GitHub Actions (see README).
cd /d "%~dp0"
if not exist node_modules (
  echo Installing dependencies, one time only...
  call npm install
)
call npx remotion studio
