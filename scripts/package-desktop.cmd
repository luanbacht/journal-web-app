@echo off
setlocal

set "APP_URL=https://journal-web-app-ermc.vercel.app/"
set "OUTPUT_DIR=%~dp0..\desktop-build"
set "APP_NAME=Journal Day"

if not exist "%OUTPUT_DIR%" (
  mkdir "%OUTPUT_DIR%"
)

if exist "%OUTPUT_DIR%\%APP_NAME%-win32-x64" (
  rmdir /s /q "%OUTPUT_DIR%\%APP_NAME%-win32-x64"
)

echo Packaging %APP_NAME% from %APP_URL%...
nativefier "%APP_URL%" ^
  --name "%APP_NAME%" ^
  --platform windows ^
  --arch x64 ^
  --width 1280 ^
  --height 800 ^
  --show-menu-bar false ^
  --single-instance ^
  --disable-dev-tools ^
  --disable-old-build-warning ^
  "%OUTPUT_DIR%"

if errorlevel 1 (
  echo Desktop packaging failed.
  exit /b 1
)

echo.
echo Desktop app is ready at:
echo %OUTPUT_DIR%\%APP_NAME%-win32-x64
