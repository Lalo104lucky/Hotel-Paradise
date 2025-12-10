# Script PowerShell para desplegar el frontend en EC2
# Ejecutar desde Windows PowerShell

Write-Host "=========================================="
Write-Host "Desplegando Frontend en AWS EC2"
Write-Host "=========================================="
Write-Host ""

# Variables
$KEY_PATH = "C:\Users\carlo\Downloads\hotel-paradise-key.pem"
$EC2_IP = "52.20.123.250"
$PROJECT_DIR = "C:\Users\carlo\Universidad\10mo Cuatrimestre\GPDS\RepoIntegradora\Integradora_Cocker_ft.Narvaez"

# Paso 1: Push cambios a Git
Write-Host "📤 Paso 1: Subiendo cambios a GitHub..."
Set-Location $PROJECT_DIR
git push origin develop
Write-Host "✅ Cambios subidos a GitHub"
Write-Host ""

# Paso 2: Copiar archivos del build a EC2
Write-Host "📦 Paso 2: Copiando archivos del frontend a EC2..."
scp -i $KEY_PATH -r "$PROJECT_DIR\frontend\dist" "ec2-user@${EC2_IP}:/tmp/"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Archivos copiados exitosamente"
} else {
    Write-Host "❌ ERROR: No se pudieron copiar los archivos"
    exit 1
}
Write-Host ""

# Paso 3: Copiar script de despliegue a EC2
Write-Host "📋 Paso 3: Copiando script de despliegue a EC2..."
scp -i $KEY_PATH "$PROJECT_DIR\deploy-frontend-to-ec2.sh" "ec2-user@${EC2_IP}:/tmp/"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Script copiado exitosamente"
} else {
    Write-Host "❌ ERROR: No se pudo copiar el script"
    exit 1
}
Write-Host ""

# Paso 4: Ejecutar script de despliegue en EC2
Write-Host "🚀 Paso 4: Ejecutando despliegue en EC2..."
Write-Host "Esto puede tomar varios minutos..."
Write-Host ""

ssh -i $KEY_PATH "ec2-user@${EC2_IP}" "chmod +x /tmp/deploy-frontend-to-ec2.sh && /tmp/deploy-frontend-to-ec2.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=========================================="
    Write-Host "✅ ¡Despliegue completado exitosamente!"
    Write-Host "=========================================="
    Write-Host ""
    Write-Host "🌐 Tu aplicación está disponible en:"
    Write-Host "   http://$EC2_IP"
    Write-Host ""
    Write-Host "📝 Prueba el login con:"
    Write-Host "   Email: admin@hotel.com"
    Write-Host "   Password: admin123"
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE: Si la página no carga, verifica que el"
    Write-Host "   Security Group de EC2 permita tráfico HTTP (puerto 80)"
    Write-Host ""
} else {
    Write-Host "❌ ERROR: Despliegue falló"
    exit 1
}
