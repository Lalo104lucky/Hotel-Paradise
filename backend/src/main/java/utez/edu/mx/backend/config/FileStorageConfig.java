package utez.edu.mx.backend.config;

import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;
import lombok.Getter;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
@Getter
public class FileStorageConfig {

    private final String uploadDir = "/opt/hotel-backend/images";

    @PostConstruct
    public void init() {
        try {
            // Crear directorio de imágenes si no existe
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                System.out.println("✓ Directorio de imágenes creado: " + uploadPath.toAbsolutePath());
            }
        } catch (IOException e) {
            throw new RuntimeException("No se pudo crear el directorio de almacenamiento de imágenes", e);
        }
    }
}
