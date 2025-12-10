#!/bin/bash

# Script para generar certificado SSL autofirmado para desarrollo/testing
# NO usar en producción - usar Let's Encrypt o AWS Certificate Manager

echo "=========================================="
echo "Generador de Certificado SSL Autofirmado"
echo "=========================================="
echo ""
echo "⚠️  ADVERTENCIA: Este certificado es solo para desarrollo/testing"
echo "⚠️  Para producción, usa Let's Encrypt o AWS Certificate Manager"
echo ""

# Configuración
KEYSTORE_PATH="src/main/resources/keystore.p12"
KEYSTORE_PASSWORD="changeit"
ALIAS="tomcat"
VALIDITY_DAYS=365
KEY_SIZE=2048

# Pedir IP o dominio
read -p "Ingresa la IP o dominio del servidor (ej: 52.20.123.250): " SERVER_HOST

# Información del certificado
DNAME="CN=${SERVER_HOST}, OU=Development, O=Hotel Paradise, L=Ciudad, ST=Estado, C=MX"

echo ""
echo "Generando certificado con la siguiente información:"
echo "  Host: ${SERVER_HOST}"
echo "  Ubicación: ${KEYSTORE_PATH}"
echo "  Validez: ${VALIDITY_DAYS} días"
echo "  Password: ${KEYSTORE_PASSWORD}"
echo ""

# Verificar si ya existe
if [ -f "$KEYSTORE_PATH" ]; then
    read -p "Ya existe un keystore. ¿Sobrescribir? (s/N): " OVERWRITE
    if [[ ! "$OVERWRITE" =~ ^[Ss]$ ]]; then
        echo "Operación cancelada."
        exit 0
    fi
    rm "$KEYSTORE_PATH"
fi

# Generar keystore
keytool -genkeypair \
    -alias "$ALIAS" \
    -keyalg RSA \
    -keysize $KEY_SIZE \
    -validity $VALIDITY_DAYS \
    -keystore "$KEYSTORE_PATH" \
    -storetype PKCS12 \
    -storepass "$KEYSTORE_PASSWORD" \
    -keypass "$KEYSTORE_PASSWORD" \
    -dname "$DNAME"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Certificado generado exitosamente!"
    echo ""
    echo "Siguiente paso:"
    echo "1. Edita src/main/resources/application.properties"
    echo "2. Descomenta las siguientes líneas:"
    echo ""
    echo "   server.ssl.enabled=true"
    echo "   server.ssl.key-store=classpath:keystore.p12"
    echo "   server.ssl.key-store-password=changeit"
    echo "   server.ssl.key-store-type=PKCS12"
    echo "   server.ssl.key-alias=tomcat"
    echo ""
    echo "3. Reinicia la aplicación"
    echo "4. Accede a https://${SERVER_HOST}:8443"
    echo ""
    echo "⚠️  El navegador mostrará advertencia de seguridad (normal con certificados autofirmados)"
    echo ""

    # Mostrar información del certificado
    echo "Información del certificado:"
    keytool -list -v -keystore "$KEYSTORE_PATH" -storepass "$KEYSTORE_PASSWORD" | head -20
else
    echo ""
    echo "❌ Error al generar certificado"
    exit 1
fi
