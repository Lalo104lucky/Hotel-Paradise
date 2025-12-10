# 🚀 Despliegue en GitHub Pages - Guía Simple

## 📋 Pasos para Desplegar

### Paso 1: Subir cambios al backend

```bash
cd "C:\Users\carlo\Universidad\10mo Cuatrimestre\GPDS\RepoIntegradora\Integradora_Cocker_ft.Narvaez"

# Commit y push de cambios en CORS
git add backend/src/main/resources/application.properties
git commit -m "feat: Add GitHub Pages URL to CORS"
git push origin develop
```

### Paso 2: Actualizar el backend en AWS EC2

```bash
# Conectarse a EC2
ssh -i "C:\Users\carlo\Downloads\hotel-paradise-key.pem" ec2-user@52.20.123.250

# Actualizar código
cd /tmp/Integradora_Cocker_ft.Narvaez
git pull origin develop
cd backend
mvn clean package -DskipTests

# Reemplazar JAR
sudo systemctl stop hotel-backend
sudo cp target/backend-0.0.1-SNAPSHOT.jar /opt/hotel-backend/app.jar
sudo chown springboot:springboot /opt/hotel-backend/app.jar
sudo systemctl start hotel-backend

# Verificar que arrancó correctamente
sudo systemctl status hotel-backend

# Salir de EC2
exit
```

### Paso 3: Desplegar el frontend en GitHub Pages

```bash
# Volver a tu máquina local
cd "C:\Users\carlo\Universidad\10mo Cuatrimestre\GPDS\RepoIntegradora\Integradora_Cocker_ft.Narvaez\frontend"

# Desplegar (esto construye y sube automáticamente)
npm run deploy
```

⏱️ **Tiempo: 2-3 minutos**

### Paso 4: Habilitar GitHub Pages (SOLO LA PRIMERA VEZ)

1. Ve a https://github.com/Carlos-GH23/Integradora_Cocker_ft.Narvaez
2. Click en **Settings** (en el menú superior)
3. En el menú izquierdo, click en **Pages**
4. En **Source**, selecciona la rama **gh-pages**
5. Click en **Save**
6. Espera 1-2 minutos

### Paso 5: Abrir tu aplicación

🌐 **URL**: https://carlos-gh23.github.io/Integradora_Cocker_ft.Narvaez/

---

## 🔑 Credenciales de Prueba

**Administrador:**
- Email: `admin@hotel.com`
- Password: `admin123`

**Camarera:**
- Email: `camarera@hotel.com`
- Password: `camarera123`

---

## 🔄 Actualizar el Frontend en el Futuro

Cuando hagas cambios en el frontend:

```bash
cd frontend
npm run deploy
```

¡Eso es todo! Los cambios estarán en línea en 1-2 minutos.

---

## 📊 Arquitectura Final

- **Frontend**: GitHub Pages (https://carlos-gh23.github.io/Integradora_Cocker_ft.Narvaez/)
- **Backend**: AWS EC2 (http://52.20.123.250:8080)
- **Base de Datos**: AWS RDS Aurora MySQL

---

## ⚠️ Troubleshooting

### Error: "Failed to get remote.origin.url"

**Solución**: Asegúrate de estar en el directorio `frontend`:
```bash
cd frontend
npm run deploy
```

### La página no carga o muestra error 404

**Solución**:
1. Ve a GitHub → Settings → Pages
2. Verifica que **Source** esté en **gh-pages**
3. Espera 1-2 minutos para que GitHub actualice

### Error de CORS en el navegador

**Solución**: Verifica que hayas actualizado el backend en EC2 con el nuevo CORS.

### El login no funciona

**Solución**:
1. Abre DevTools (F12) → Console
2. Verifica que las peticiones vayan a `http://52.20.123.250:8080`
3. Verifica que el backend esté corriendo en EC2:
   ```bash
   ssh -i "C:\Users\carlo\Downloads\hotel-paradise-key.pem" ec2-user@52.20.123.250
   sudo systemctl status hotel-backend
   ```

---

## ✅ Ventajas de GitHub Pages

- ✅ **Gratis** y sin límites
- ✅ **HTTPS automático** (más seguro)
- ✅ **CDN global** (más rápido en todo el mundo)
- ✅ **Despliegue automático** con un solo comando
- ✅ **Sin configuración de servidores**
