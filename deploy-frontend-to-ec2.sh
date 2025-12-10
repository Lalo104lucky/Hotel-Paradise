#!/bin/bash

# Script para desplegar el frontend en EC2
# Ejecutar este script EN EL SERVIDOR EC2

echo "=========================================="
echo "Desplegando Frontend en EC2"
echo "=========================================="
echo ""

# Paso 1: Instalar Nginx
echo "📦 Paso 1: Instalando Nginx..."
sudo yum install -y nginx
echo "✅ Nginx instalado"
echo ""

# Paso 2: Crear directorio para el frontend
echo "📁 Paso 2: Creando directorio para el frontend..."
sudo mkdir -p /var/www/hotel-frontend
echo "✅ Directorio creado"
echo ""

# Paso 3: Copiar archivos del build
echo "📋 Paso 3: Copiando archivos del frontend..."
if [ -d "/tmp/dist" ]; then
    sudo cp -r /tmp/dist/* /var/www/hotel-frontend/
    echo "✅ Archivos copiados"
else
    echo "❌ ERROR: /tmp/dist no existe. Asegúrate de haber subido los archivos con SCP primero."
    exit 1
fi
echo ""

# Paso 4: Ajustar permisos
echo "🔐 Paso 4: Ajustando permisos..."
sudo chown -R nginx:nginx /var/www/hotel-frontend
sudo chmod -R 755 /var/www/hotel-frontend
echo "✅ Permisos configurados"
echo ""

# Paso 5: Configurar Nginx
echo "⚙️  Paso 5: Configurando Nginx..."
sudo tee /etc/nginx/conf.d/hotel-frontend.conf > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;

    root /var/www/hotel-frontend;
    index index.html;

    # Habilitar compresión gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Servir archivos estáticos
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cachear archivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy para el backend (acceso a través de /api)
    location /api/ {
        proxy_pass http://localhost:8080/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
echo "✅ Configuración de Nginx creada"
echo ""

# Paso 6: Verificar configuración de Nginx
echo "🔍 Paso 6: Verificando configuración de Nginx..."
sudo nginx -t
if [ $? -eq 0 ]; then
    echo "✅ Configuración válida"
else
    echo "❌ ERROR: Configuración inválida"
    exit 1
fi
echo ""

# Paso 7: Iniciar Nginx
echo "🚀 Paso 7: Iniciando Nginx..."
sudo systemctl enable nginx
sudo systemctl restart nginx
echo "✅ Nginx iniciado"
echo ""

# Paso 8: Actualizar backend con nuevo CORS
echo "🔄 Paso 8: Actualizando backend..."
cd /tmp/Integradora_Cocker_ft.Narvaez
git pull origin develop
cd backend
mvn clean package -DskipTests

sudo systemctl stop hotel-backend
sudo cp target/backend-0.0.1-SNAPSHOT.jar /opt/hotel-backend/app.jar
sudo chown springboot:springboot /opt/hotel-backend/app.jar
sudo systemctl start hotel-backend
echo "✅ Backend actualizado"
echo ""

# Verificar estado de los servicios
echo "=========================================="
echo "📊 Estado de los servicios:"
echo "=========================================="
echo ""
echo "Frontend (Nginx):"
sudo systemctl status nginx --no-pager -l
echo ""
echo "Backend (Spring Boot):"
sudo systemctl status hotel-backend --no-pager -l
echo ""

echo "=========================================="
echo "✅ ¡Despliegue completado!"
echo "=========================================="
echo ""
echo "🌐 URLs:"
echo "   Frontend: http://52.20.123.250"
echo "   Backend:  http://52.20.123.250:8080"
echo ""
echo "📝 Credenciales de prueba:"
echo "   Admin:"
echo "     - Email: admin@hotel.com"
echo "     - Password: admin123"
echo ""
echo "   Camarera:"
echo "     - Email: camarera@hotel.com"
echo "     - Password: camarera123"
echo ""
echo "⚠️  IMPORTANTE: Asegúrate de que el Security Group de EC2"
echo "   permita tráfico entrante en el puerto 80 (HTTP)"
echo ""
