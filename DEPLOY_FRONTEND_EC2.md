# Guía de Despliegue del Frontend en EC2

## Resumen
Desplegar el frontend React (Vite) en la misma instancia EC2 usando Nginx como servidor web.

## Arquitectura Final
- **Frontend**: Nginx en puerto 80 (http://52.20.123.250)
- **Backend**: Spring Boot en puerto 8080 (http://52.20.123.250:8080)

---

## Paso 1: Subir los archivos del build a EC2

Desde tu máquina Windows, usa SCP para copiar el directorio `dist` a EC2:

```bash
# Asegúrate de estar en el directorio raíz del proyecto
cd "C:\Users\carlo\Universidad\10mo Cuatrimestre\GPDS\RepoIntegradora\Integradora_Cocker_ft.Narvaez"

# Copiar el directorio dist a EC2 (reemplaza con tu archivo .pem correcto)
scp -i "C:\Users\carlo\Downloads\hotel-paradise-key.pem" -r frontend/dist ec2-user@52.20.123.250:/tmp/
```

**Nota**: Si el comando falla por permisos del archivo .pem, asegúrate de que solo tu usuario tenga permisos de lectura en el archivo.

---

## Paso 2: Conectarse a EC2 e instalar Nginx

```bash
# Conectarse a EC2
ssh -i "C:\Users\carlo\Downloads\hotel-paradise-key.pem" ec2-user@52.20.123.250
```

Una vez dentro del servidor EC2:

```bash
# Instalar Nginx
sudo yum install -y nginx

# Verificar que se instaló correctamente
nginx -v
```

---

## Paso 3: Configurar Nginx

```bash
# Crear directorio para el frontend
sudo mkdir -p /var/www/hotel-frontend

# Copiar archivos del build
sudo cp -r /tmp/dist/* /var/www/hotel-frontend/

# Ajustar permisos
sudo chown -R nginx:nginx /var/www/hotel-frontend
sudo chmod -R 755 /var/www/hotel-frontend

# Crear configuración de Nginx
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

    # Proxy para el backend (opcional, si quieres acceder al backend a través de /api)
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

# Verificar configuración de Nginx
sudo nginx -t

# Si la configuración es correcta, iniciar Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl status nginx
```

---

## Paso 4: Configurar el Firewall (Security Group)

**En AWS Console**:

1. Ve a EC2 → Instances → Selecciona tu instancia
2. Ve a la pestaña "Security"
3. Click en el Security Group
4. Click en "Edit inbound rules"
5. Agrega una nueva regla:
   - **Type**: HTTP
   - **Protocol**: TCP
   - **Port**: 80
   - **Source**: 0.0.0.0/0 (o tu IP específica para mayor seguridad)
6. Click "Save rules"

**O desde la línea de comandos (si tienes AWS CLI configurado)**:

```bash
# Obtener el Security Group ID de tu instancia
aws ec2 describe-instances --instance-ids i-tu-instance-id --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId'

# Agregar regla para puerto 80
aws ec2 authorize-security-group-ingress \
    --group-id sg-tu-security-group-id \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0
```

---

## Paso 5: Actualizar CORS en el Backend

El backend necesita permitir solicitudes desde el frontend en producción.

```bash
# En el servidor EC2
cd /tmp/Integradora_Cocker_ft.Narvaez
git pull origin develop

# Editar application.properties
sudo nano backend/src/main/resources/application.properties
```

Actualiza la línea de CORS:

```properties
# ANTES:
cors.allowed-origins=http://localhost:5173,http://localhost:3000,https://your-frontend-domain.com

# DESPUÉS:
cors.allowed-origins=http://localhost:5173,http://localhost:3000,http://52.20.123.250
```

**O hazlo desde tu máquina local y luego sube los cambios**:

```bash
# En tu máquina local
cd "C:\Users\carlo\Universidad\10mo Cuatrimestre\GPDS\RepoIntegradora\Integradora_Cocker_ft.Narvaez"

# Edita el archivo backend/src/main/resources/application.properties
# Luego commit y push

git add backend/src/main/resources/application.properties
git commit -m "feat: Add production frontend URL to CORS"
git push origin develop
```

Luego en EC2, reconstruye y redespliega el backend:

```bash
# En EC2
cd /tmp/Integradora_Cocker_ft.Narvaez
git pull origin develop
cd backend
mvn clean package -DskipTests

sudo systemctl stop hotel-backend
sudo cp target/backend-0.0.1-SNAPSHOT.jar /opt/hotel-backend/app.jar
sudo chown springboot:springboot /opt/hotel-backend/app.jar
sudo systemctl start hotel-backend
sudo systemctl status hotel-backend
```

---

## Paso 6: Verificar el Despliegue

### Verificar Nginx
```bash
# Ver logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Ver estado del servicio
sudo systemctl status nginx
```

### Probar el Frontend
Abre tu navegador y ve a:

**http://52.20.123.250**

Deberías ver la página de login de tu aplicación.

### Probar el Login
1. Abre http://52.20.123.250
2. Inicia sesión con:
   - Email: `admin@hotel.com`
   - Password: `admin123`

Si el login funciona, ¡el frontend y backend están conectados correctamente! 🎉

---

## Troubleshooting

### Error: "Cannot GET /"
- Verifica que los archivos estén en `/var/www/hotel-frontend`
- Revisa los logs de Nginx: `sudo tail -f /var/log/nginx/error.log`

### Error de CORS
- Verifica que el backend tenga la URL del frontend en CORS
- Revisa los logs del backend: `sudo journalctl -u hotel-backend -f`

### Página en blanco
- Abre las DevTools del navegador (F12)
- Revisa la consola en busca de errores
- Verifica que la URL del backend en `.env.production` sea correcta

### Nginx no inicia
- Verifica la configuración: `sudo nginx -t`
- Revisa los logs: `sudo journalctl -u nginx -f`

---

## Actualizar el Frontend en el Futuro

Cuando hagas cambios en el frontend:

```bash
# En tu máquina local
cd frontend
npm run build

# Subir nuevos archivos a EC2
scp -i "C:\Users\carlo\Downloads\hotel-paradise-key.pem" -r dist ec2-user@52.20.123.250:/tmp/

# En EC2
ssh -i "C:\Users\carlo\Downloads\hotel-paradise-key.pem" ec2-user@52.20.123.250

sudo rm -rf /var/www/hotel-frontend/*
sudo cp -r /tmp/dist/* /var/www/hotel-frontend/
sudo chown -R nginx:nginx /var/www/hotel-frontend

# Limpiar caché de Nginx (opcional)
sudo systemctl reload nginx
```

---

## URLs Finales

- **Frontend**: http://52.20.123.250
- **Backend**: http://52.20.123.250:8080
- **API directa**: http://52.20.123.250/api/* (proxy a través de Nginx)

---

## Seguridad Adicional (Opcional)

Para producción real, considera:

1. **HTTPS con Let's Encrypt**:
   ```bash
   sudo yum install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d tu-dominio.com
   ```

2. **Firewall más restrictivo**: Limita acceso solo a IPs específicas

3. **Variables de entorno**: Usa AWS Secrets Manager para credenciales sensibles

4. **Dominio personalizado**: Configura un dominio en lugar de usar la IP pública
