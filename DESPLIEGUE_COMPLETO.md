# 🚀 Despliegue Completo - Frontend y Backend en AWS

## Estado Actual

✅ **Backend**: Desplegado y funcionando en AWS EC2
- URL: http://52.20.123.250:8080
- Base de datos RDS conectada
- Servicio systemd activo

✅ **Frontend**: Build creado y listo para desplegar
- Archivos en `frontend/dist/`
- Configurado para conectarse al backend en AWS

---

## 🎯 Opción 1: Despliegue Automático (RECOMENDADO)

### Paso Único: Ejecutar el script PowerShell

Abre **PowerShell** y ejecuta:

```powershell
cd "C:\Users\carlo\Universidad\10mo Cuatrimestre\GPDS\RepoIntegradora\Integradora_Cocker_ft.Narvaez"

.\deploy-frontend.ps1
```

Este script:
1. Sube cambios a GitHub
2. Copia archivos del frontend a EC2
3. Instala y configura Nginx
4. Actualiza el backend con nuevo CORS
5. Inicia todos los servicios

**⏱️ Tiempo estimado: 5-10 minutos**

---

## 🔧 Opción 2: Despliegue Manual

### Paso 1: Subir cambios a GitHub

```bash
cd "C:\Users\carlo\Universidad\10mo Cuatrimestre\GPDS\RepoIntegradora\Integradora_Cocker_ft.Narvaez"
git push origin develop
```

### Paso 2: Copiar archivos a EC2

```bash
scp -i "C:\Users\carlo\Downloads\hotel-paradise-key.pem" -r frontend/dist ec2-user@52.20.123.250:/tmp/

scp -i "C:\Users\carlo\Downloads\hotel-paradise-key.pem" deploy-frontend-to-ec2.sh ec2-user@52.20.123.250:/tmp/
```

### Paso 3: Conectarse a EC2 y ejecutar el script

```bash
ssh -i "C:\Users\carlo\Downloads\hotel-paradise-key.pem" ec2-user@52.20.123.250

# Una vez dentro de EC2:
chmod +x /tmp/deploy-frontend-to-ec2.sh
/tmp/deploy-frontend-to-ec2.sh
```

---

## ⚠️ IMPORTANTE: Configurar Security Group

**Debes permitir tráfico HTTP en el puerto 80**

### Opción A: Desde AWS Console

1. Ve a **AWS Console** → **EC2** → **Instances**
2. Selecciona tu instancia
3. Click en la pestaña **Security**
4. Click en el **Security Group**
5. Click **Edit inbound rules**
6. Click **Add rule**
7. Configura:
   - **Type**: HTTP
   - **Protocol**: TCP
   - **Port**: 80
   - **Source**: 0.0.0.0/0 (o tu IP específica)
8. Click **Save rules**

### Opción B: Desde AWS CLI (si lo tienes configurado)

```bash
# Reemplaza sg-XXXXXXXX con tu Security Group ID
aws ec2 authorize-security-group-ingress \
    --group-id sg-XXXXXXXX \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0
```

---

## 🧪 Verificar el Despliegue

### 1. Verificar que Nginx está corriendo

```bash
ssh -i "C:\Users\carlo\Downloads\hotel-paradise-key.pem" ec2-user@52.20.123.250

sudo systemctl status nginx
sudo systemctl status hotel-backend
```

### 2. Abrir el frontend en el navegador

Abre: **http://52.20.123.250**

### 3. Probar el login

Usa estas credenciales:

**Administrador:**
- Email: `admin@hotel.com`
- Password: `admin123`

**Camarera:**
- Email: `camarera@hotel.com`
- Password: `camarera123`

---

## 🎉 URLs Finales

| Servicio | URL |
|----------|-----|
| **Frontend (Producción)** | http://52.20.123.250 |
| **Backend API** | http://52.20.123.250:8080 |
| **Frontend (Desarrollo Local)** | http://localhost:5173 |

---

## 🔄 Actualizar el Frontend en el Futuro

Cuando hagas cambios en el código del frontend:

### Opción Rápida (Script Automático):

```powershell
# Reconstruir el frontend
cd frontend
npm run build
cd ..

# Desplegar
.\deploy-frontend.ps1
```

### Opción Manual:

```bash
# 1. Reconstruir
cd frontend
npm run build

# 2. Copiar a EC2
scp -i "C:\Users\carlo\Downloads\hotel-paradise-key.pem" -r dist ec2-user@52.20.123.250:/tmp/

# 3. En EC2
ssh -i "C:\Users\carlo\Downloads\hotel-paradise-key.pem" ec2-user@52.20.123.250

sudo rm -rf /var/www/hotel-frontend/*
sudo cp -r /tmp/dist/* /var/www/hotel-frontend/
sudo chown -R nginx:nginx /var/www/hotel-frontend
sudo systemctl reload nginx
```

---

## 🐛 Troubleshooting

### La página no carga (ERR_CONNECTION_REFUSED)

**Causa**: El puerto 80 no está abierto en el Security Group

**Solución**: Sigue los pasos de "Configurar Security Group" arriba

### Página en blanco o error 404

**Causa**: Los archivos no se copiaron correctamente

**Solución**:
```bash
ssh -i "C:\Users\carlo\Downloads\hotel-paradise-key.pem" ec2-user@52.20.123.250

# Verificar que existen los archivos
ls -la /var/www/hotel-frontend/

# Debe mostrar: index.html, assets/, etc.
```

### Error de CORS en el navegador

**Causa**: El backend no tiene la URL del frontend en CORS

**Solución**: Verifica que `application.properties` tenga:
```properties
cors.allowed-origins=http://localhost:5173,http://localhost:3000,http://52.20.123.250
```

### El login no funciona

**Causa**: El frontend no se puede conectar al backend

**Solución**:
1. Abre las DevTools del navegador (F12)
2. Ve a la pestaña "Network"
3. Intenta hacer login
4. Verifica que las peticiones vayan a `http://52.20.123.250:8080`

### Nginx muestra "502 Bad Gateway"

**Causa**: El backend no está corriendo

**Solución**:
```bash
ssh -i "C:\Users\carlo\Downloads\hotel-paradise-key.pem" ec2-user@52.20.123.250

sudo systemctl status hotel-backend
sudo journalctl -u hotel-backend -n 50
```

---

## 📊 Logs Útiles

```bash
# Logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs del Backend
sudo journalctl -u hotel-backend -f

# Estado de servicios
sudo systemctl status nginx
sudo systemctl status hotel-backend
```

---

## 🔒 Mejoras de Seguridad (Opcional para Producción)

### 1. Habilitar HTTPS con Let's Encrypt

```bash
sudo yum install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

### 2. Configurar dominio personalizado

En lugar de usar `52.20.123.250`, puedes:
1. Comprar un dominio (ej: hoteles.com)
2. Apuntarlo a tu IP de EC2
3. Configurar SSL/TLS con Let's Encrypt

### 3. Restringir acceso SSH

Cambia el Security Group para permitir SSH solo desde tu IP.

---

## 📝 Notas Importantes

- ✅ Los archivos `.env` NO se suben a Git (están en `.gitignore`)
- ✅ El backend y frontend comparten el mismo servidor EC2
- ✅ Nginx sirve el frontend en puerto 80
- ✅ Spring Boot sirve el backend en puerto 8080
- ⚠️ Usa variables de entorno para credenciales en producción real
- ⚠️ Considera usar RDS con credenciales rotativas para mayor seguridad
