FROM maven:3.9.9-eclipse-temurin-21

WORKDIR /app

COPY . .

# mvvn clean package -DskipTests = target/server-0.0.1-SNAPSHOT.jar
# cp target/*.jar app.jar = server-00.0.1-SNAPSHOT.jar  -> app.jar
#RUN mvn clean package -DskipTests && cp target/*.jar app.jar

# Esto es mejor para ver el error de Maven
RUN mvn clean package -DskipTests

# Si el comando de arriba fue exitoso, el siguiente se ejecutará
RUN cp target/*.jar app.jar


EXPOSE 8080

ENTRYPOINT ["java","-jar","app.jar"]
