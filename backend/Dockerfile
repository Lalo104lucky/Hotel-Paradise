# ----------------------------------------------------------------------
# STAGE 1: BUILDER - Para compilar el código y generar el JAR
# ----------------------------------------------------------------------
# Usamos una imagen que tiene Maven y el JDK
FROM maven:3.9.9-eclipse-temurin-21 AS builder

WORKDIR /app

# 1. Copiamos el POM para descargar dependencias primero (cache)
COPY pom.xml .

# Descargamos dependencias
RUN mvn dependency:go-offline

# 2. Copiamos todo el código fuente
COPY . .

# 3. Compilamos y generamos el JAR
# NOTA: Si este paso falla aquí, el problema es SÍ un error de compilación.
RUN mvn clean package -DskipTests

# ----------------------------------------------------------------------
# STAGE 2: RUNNER - Imagen final ligera para ejecutar el JAR
# ----------------------------------------------------------------------
# Usamos una imagen que solo tiene el JRE (Runtime Environment)
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copiamos el archivo JAR compilado desde la etapa 'builder'
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java","-jar","app.jar"]
