@echo off
setlocal enabledelayedexpansion

set "version=0.0.15"

:: Check if extension is already installed
code --list-extensions 2>nul | findstr "liquid-java" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ LiquidJava extension already installed!
    exit /b 0
)

:: Setup script for LiquidJava development environment
echo 🚀 Starting LiquidJava development environment setup...

:: Check if Git LFS is installed
git lfs version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Git LFS not found. Please install Git LFS manually from https://git-lfs.github.io/
    echo    After installing Git LFS, run: git lfs install
    pause
    exit /b 1
) else (
    echo ✅ Git LFS already installed
)

:: Pull LFS files
echo 🔄 Pulling Git LFS files...
git lfs pull

:: Check if the VSIX file exists and is valid
set "vsix_path=.\client\extension\liquid-java-%version%.vsix"
if exist "%vsix_path%" (
    echo 🔍 VSIX file found, checking integrity...
    for %%A in ("%vsix_path%") do set "file_size=%%~zA"
    if !file_size! lss 1000 (
        echo ❌ VSIX file appears to be an LFS pointer file ^(too small^)
    ) else (
        echo ✅ VSIX file appears to be valid ^(!file_size! bytes^)
    )
) else (
    echo ❌ VSIX file not found at %vsix_path%
)

:: Install extension
echo 🔧 Installing LiquidJava VSCode extension...
code --install-extension "%vsix_path%"
if %errorlevel% equ 0 (
    echo ✅ Extension installed successfully
) else (
    echo ❌ Failed to install the extension
)

echo 🎉 Installation complete!
pause