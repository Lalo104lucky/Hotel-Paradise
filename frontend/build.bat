@echo off
REM Script de build para GitHub Pages (Windows)
REM Este script construye el proyecto y copia los archivos necesarios

echo 🔨 Building project...
set NODE_ENV=production
call npm run build

echo 📦 Copying PWA files to dist...
copy public\sw.js dist\sw.js
copy public\manifest.json dist\manifest.json
copy public\404.html dist\404.html

echo ✅ Build completed successfully!
echo.
echo 📁 Contents of dist directory:
dir dist

echo.
echo ✨ Ready to deploy!
echo 🚀 To deploy manually, run: npm run deploy
