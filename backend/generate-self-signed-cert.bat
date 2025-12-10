@echo off
setlocal enabledelayedexpansion

REM Script para generar certificado SSL autofirmado para desarrollo/testing
REM NO usar en producción - usar Let's Encrypt o AWS Certificate Manager

echo ==========================================
echo Generador de Certificado SSL Autofirmado
echo ==========================================
echo.
echo WARNING: Este certificado es solo para desarrollo/testing
echo WARNING: Para producción, usa Let's Encrypt o AWS Certificate Manager
echo.

REM Configuración
set KEYSTORE_PATH=src\main\resources\keystore.p12
set KEYSTORE_PASSWORD=changeit
set ALIAS=tomcat
set VALIDITY_DAYS=365
set KEY_SIZE=2048

REM Pedir IP o dominio
set /p SERVER_HOST="Ingresa la IP o dominio del servidor (ej: 52.20.123.250): "

REM Información del certificado
set DNAME=CN=%SERVER_HOST%, OU=Development, O=Hotel Paradise, L=Ciudad, ST=Estado, C=MX

echo.
echo Generando certificado con la siguiente información:
echo   Host: %SERVER_HOST%
echo   Ubicación: %KEYSTORE_PATH%
echo   Validez: %VALIDITY_DAYS% días
echo   Password: %KEYSTORE_PASSWORD%
echo.

REM Verificar si ya existe
if exist "%KEYSTORE_PATH%" (
    set /p OVERWRITE="Ya existe un keystore. ¿Sobrescribir? (s/N): "
    if /i not "!OVERWRITE!"=="s" (
        echo Operación cancelada.
        exit /b 0
    )
    del "%KEYSTORE_PATH%"
)

REM Generar keystore
keytool -genkeypair ^
    -alias "%ALIAS%" ^
    -keyalg RSA ^
    -keysize %KEY_SIZE% ^
    -validity %VALIDITY_DAYS% ^
    -keystore "%KEYSTORE_PATH%" ^
    -storetype PKCS12 ^
    -storepass "%KEYSTORE_PASSWORD%" ^
    -keypass "%KEYSTORE_PASSWORD%" ^
    -dname "%DNAME%"

if %errorlevel% equ 0 (
    echo.
    echo ✓ Certificado generado exitosamente!
    echo.
    echo Siguiente paso:
    echo 1. Edita src\main\resources\application.properties
    echo 2. Descomenta las siguientes líneas:
    echo.
    echo    server.ssl.enabled=true
    echo    server.ssl.key-store=classpath:keystore.p12
    echo    server.ssl.key-store-password=changeit
    echo    server.ssl.key-store-type=PKCS12
    echo    server.ssl.key-alias=tomcat
    echo.
    echo 3. Reinicia la aplicación
    echo 4. Accede a https://%SERVER_HOST%:8443
    echo.
    echo WARNING: El navegador mostrará advertencia de seguridad (normal con certificados autofirmados^)
    echo.

    REM Mostrar información del certificado
    echo Información del certificado:
    keytool -list -v -keystore "%KEYSTORE_PATH%" -storepass "%KEYSTORE_PASSWORD%"
) else (
    echo.
    echo X Error al generar certificado
    echo.
    echo Asegúrate de tener Java JDK instalado y keytool en el PATH
    exit /b 1
)

endlocal
pause
