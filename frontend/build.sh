#!/bin/bash

# Script de build para GitHub Pages
# Este script construye el proyecto y copia los archivos necesarios

echo "🔨 Building project..."
NODE_ENV=production npm run build

echo "📦 Copying PWA files to dist..."
cp public/sw.js dist/sw.js
cp public/manifest.json dist/manifest.json
cp public/404.html dist/404.html

echo "✅ Build completed successfully!"
echo ""
echo "📁 Contents of dist directory:"
ls -la dist/

echo ""
echo "✨ Ready to deploy!"
echo "🚀 To deploy manually, run: npm run deploy"
