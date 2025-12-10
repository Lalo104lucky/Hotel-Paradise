package utez.edu.mx.backend.hotel.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import utez.edu.mx.backend.config.FileStorageConfig;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final FileStorageConfig fileStorageConfig;

    /**
     * Genera el identificador de carpeta para una habitación
     * Formato: HTL-Piso-NumeroHabitacion
     * Ejemplo: HTL-3-305
     */
    public String generateRoomFolder(String floor, String roomNumber) {
        return String.format("HTL-%s-%s", floor, roomNumber);
    }

    /**
     * Guarda múltiples archivos en la carpeta de la habitación
     */
    public List<String> saveFiles(MultipartFile[] files, String roomFolder) throws IOException {
        log.info("Iniciando guardado de {} archivos para la carpeta {}", files != null ? files.length : 0, roomFolder);
        List<String> savedFilePaths = new ArrayList<>();

        if (files == null || files.length == 0) {
            log.warn("No se proporcionaron archivos para guardar en la carpeta {}", roomFolder);
            return savedFilePaths;
        }

        // Crear directorio de la habitación si no existe
        Path roomPath = Paths.get(fileStorageConfig.getUploadDir(), roomFolder);
        if (!Files.exists(roomPath)) {
            Files.createDirectories(roomPath);
            log.info("Directorio creado para habitación: {}", roomPath.toAbsolutePath());
        }

        // Guardar cada archivo
        for (MultipartFile file : files) {
            if (file.isEmpty()) {
                continue;
            }

            // Generar nombre único para el archivo
            String originalFilename = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String uniqueFilename = UUID.randomUUID().toString() + fileExtension;

            // Guardar archivo
            Path filePath = roomPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Guardar ruta relativa
            String relativePath = roomFolder + "/" + uniqueFilename;
            savedFilePaths.add(relativePath);

            log.info("Archivo guardado: {}", filePath.toAbsolutePath());
        }

        return savedFilePaths;
    }

    /**
     * Elimina todos los archivos de una incidencia
     */
    public void deleteIncidentFiles(List<String> photoUrls) {
        if (photoUrls == null || photoUrls.isEmpty()) {
            log.debug("No hay URLs de fotos para eliminar.");
            return;
        }
        log.info("Iniciando eliminación de {} archivos de incidencia.", photoUrls.size());

        for (String photoUrl : photoUrls) {
            try {
                Path filePath = Paths.get(fileStorageConfig.getUploadDir(), photoUrl);
                if (Files.exists(filePath)) {
                    Files.delete(filePath);
                    log.info("Archivo eliminado: {}", filePath.toAbsolutePath());
                } else {
                    log.warn("Se intentó eliminar un archivo que no existe: {}", filePath.toAbsolutePath());
                }
            } catch (IOException e) {
                log.error("Error al eliminar archivo: {}", photoUrl, e);
            }
        }
    }

    /**
     * Elimina toda la carpeta de una habitación si está vacía
     */
    public void deleteRoomFolderIfEmpty(String roomFolder) {
        log.info("Intentando eliminar la carpeta de la habitación si está vacía: {}", roomFolder);
        try {
            Path roomPath = Paths.get(fileStorageConfig.getUploadDir(), roomFolder);
            if (Files.exists(roomPath) && Files.isDirectory(roomPath)) {
                // Verificar si la carpeta está vacía
                try (var stream = Files.list(roomPath)) {
                    if (stream.findAny().isEmpty()) {
                        Files.delete(roomPath);
                        log.info("Carpeta vacía eliminada: {}", roomPath.toAbsolutePath());
                    } else {
                        log.debug("La carpeta de la habitación no está vacía, no se eliminará: {}", roomPath.toAbsolutePath());
                    }
                }
            }
        } catch (IOException e) {
            log.error("Error al eliminar carpeta de habitación: {}", roomFolder, e);
        }
    }

    /**
     * Obtiene el archivo físico
     */
    public Path loadFile(String filename) {
        log.debug("Cargando archivo: {}", filename);
        return Paths.get(fileStorageConfig.getUploadDir()).resolve(filename).normalize();
    }
}
