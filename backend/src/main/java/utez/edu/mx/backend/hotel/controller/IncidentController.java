package utez.edu.mx.backend.hotel.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import utez.edu.mx.backend.hotel.dto.CreateIncidentRequest;
import utez.edu.mx.backend.hotel.dto.IncidentResponse;
import utez.edu.mx.backend.hotel.dto.UpdateIncidentStatusRequest;
import utez.edu.mx.backend.hotel.model.Incident;
import utez.edu.mx.backend.hotel.service.FileStorageService;
import utez.edu.mx.backend.hotel.service.IncidentService;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
public class IncidentController {
    private final IncidentService incidentService;
    private final FileStorageService fileStorageService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_CAMARERA')")
    public ResponseEntity<List<IncidentResponse>> getAllIncidents() {
        return ResponseEntity.ok(incidentService.getAllIncidents());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_CAMARERA')")
    public ResponseEntity<IncidentResponse> getIncidentById(@PathVariable Long id) {
        return ResponseEntity.ok(incidentService.getIncidentById(id));
    }

    @GetMapping("/room/{roomId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_CAMARERA')")
    public ResponseEntity<List<IncidentResponse>> getIncidentsByRoom(@PathVariable Long roomId) {
        return ResponseEntity.ok(incidentService.getIncidentsByRoom(roomId));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<IncidentResponse>> getIncidentsByStatus(@PathVariable Incident.IncidentStatus status) {
        return ResponseEntity.ok(incidentService.getIncidentsByStatus(status));
    }

    /**
     * Endpoint principal para crear incidencias con archivos de foto
     */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_CAMARERA', 'ROLE_ADMIN')")
    public ResponseEntity<?> createIncidentWithFiles(
            @RequestParam(value = "roomId", required = false) Long roomId,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "isOffline", required = false) Boolean isOffline,
            @RequestParam(value = "photos", required = false) MultipartFile[] photos
    ) {
        try {
            // Validaciones con mensajes claros
            if (roomId == null) {
                return ResponseEntity.badRequest().body("roomId es requerido");
            }
            if (title == null || title.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("title es requerido");
            }

            System.out.println("=== DEBUG INCIDENT CREATION ===");
            System.out.println("roomId: " + roomId);
            System.out.println("title: " + title);
            System.out.println("description: " + description);
            System.out.println("isOffline: " + isOffline);
            System.out.println("photos: " + (photos != null ? photos.length : 0) + " archivos");

            IncidentResponse response = incidentService.createIncidentWithFiles(
                    roomId, title, description, isOffline, photos
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            System.err.println("Error de validación: " + e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IOException e) {
            System.err.println("Error al guardar fotos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al guardar las fotos: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Error inesperado: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error inesperado: " + e.getMessage());
        }
    }

    /**
     * Endpoint alternativo para crear incidencias sin archivos (JSON)
     */
    @PostMapping(value = "/json", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAuthority('ROLE_CAMARERA')")
    public ResponseEntity<IncidentResponse> createIncident(@Valid @RequestBody CreateIncidentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(incidentService.createIncident(request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<IncidentResponse> updateIncidentStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateIncidentStatusRequest request
    ) {
        return ResponseEntity.ok(incidentService.updateIncidentStatus(id, request));
    }

    @GetMapping("/pending-sync")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<IncidentResponse>> getPendingSyncIncidents() {
        return ResponseEntity.ok(incidentService.getPendingSyncIncidents());
    }

    /**
     * Endpoint para servir imágenes de incidencias
     * Público para permitir visualización en etiquetas <img>
     */
    @GetMapping("/images/{roomFolder}/{filename:.+}")
    public ResponseEntity<Resource> serveImage(
            @PathVariable String roomFolder,
            @PathVariable String filename
    ) {
        try {
            Path filePath = fileStorageService.loadFile(roomFolder + "/" + filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                        .contentType(MediaType.IMAGE_JPEG) // Ajustar según tipo de archivo
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
