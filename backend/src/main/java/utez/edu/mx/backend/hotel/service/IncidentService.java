package utez.edu.mx.backend.hotel.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import utez.edu.mx.backend.User.model.User;
import utez.edu.mx.backend.User.model.UserRepository;
import utez.edu.mx.backend.hotel.dto.CreateIncidentRequest;
import utez.edu.mx.backend.hotel.dto.IncidentResponse;
import utez.edu.mx.backend.hotel.dto.UpdateIncidentStatusRequest;
import utez.edu.mx.backend.hotel.model.Incident;
import utez.edu.mx.backend.hotel.model.IncidentPhoto;
import utez.edu.mx.backend.hotel.model.Room;
import utez.edu.mx.backend.hotel.repository.IncidentRepository;
import utez.edu.mx.backend.hotel.repository.RoomRepository;
import utez.edu.mx.backend.notification.model.Notification;
import utez.edu.mx.backend.notification.service.NotificationService;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class IncidentService {
    private final IncidentRepository incidentRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;

    /**
     * Crea una incidencia con archivos de foto (Multipart)
     */
    @Transactional
    public IncidentResponse createIncidentWithFiles(Long roomId, String title, String description,
                                                    Boolean isOffline, MultipartFile[] photos) throws IOException {
        // Obtener usuario autenticado directamente del contexto de seguridad
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        // Verificar que la habitación existe
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Habitación no encontrada"));

        // Generar carpeta de la habitación: HTL-Piso-NumeroHabitacion
        String roomFolder = fileStorageService.generateRoomFolder(room.getFloor(), room.getRoomNumber());

        // Guardar archivos físicos
        List<String> savedPhotoPaths = fileStorageService.saveFiles(photos, roomFolder);

        // Crear incidencia
        Incident incident = Incident.builder()
                .room(room)
                .reportedByUser(user)
                .title(title)
                .description(description)
                .status(Incident.IncidentStatus.ABIERTA)
                .isOffline(isOffline != null ? isOffline : false)
                .isSynced(!Boolean.TRUE.equals(isOffline))
                .syncedAt(Boolean.TRUE.equals(isOffline) ? null : Instant.now())
                .photos(new ArrayList<>())
                .build();

        // Agregar fotos a la incidencia
        for (String photoPath : savedPhotoPaths) {
            IncidentPhoto photo = IncidentPhoto.builder()
                    .incident(incident)
                    .photoUrl(photoPath)
                    .build();
            incident.getPhotos().add(photo);
        }

        Incident savedIncident = incidentRepository.save(incident);

        // Bloquear la habitación por incidencia
        room.setCurrentStatus(Room.RoomStatus.BLOQUEADA_INCIDENCIA);
        room.setLastStatusChange(Instant.now());
        roomRepository.save(room);

        log.info("Incidencia creada para habitación {} con {} fotos. Habitación bloqueada.",
                room.getRoomNumber(), savedPhotoPaths.size());

        // Enviar notificación a todos los administradores
        List<User> admins = userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.ADMIN)
                .toList();

        if (!admins.isEmpty()) {
            String notificationTitle = "Nueva incidencia reportada";
            String notificationBody = String.format("Habitación %s - Piso %s: %s",
                    room.getRoomNumber(), room.getFloor(), title);
            notificationService.createAndSendNotificationToMultiple(
                    admins,
                    notificationTitle,
                    notificationBody,
                    Notification.NotificationType.INCIDENT
            );
        }

        return IncidentResponse.fromEntity(savedIncident);
    }

    /**
     * Crea una incidencia sin archivos (para compatibilidad o modo offline)
     */
    @Transactional
    public IncidentResponse createIncident(CreateIncidentRequest request) {
        // Obtener usuario autenticado directamente del contexto de seguridad
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        // Verificar que la habitación existe
        Room room = roomRepository.findById(request.roomId())
                .orElseThrow(() -> new IllegalArgumentException("Habitación no encontrada"));

        // Crear incidencia
        Incident incident = Incident.builder()
                .room(room)
                .reportedByUser(user)
                .title(request.title())
                .description(request.description())
                .status(Incident.IncidentStatus.ABIERTA)
                .isOffline(request.isOffline() != null ? request.isOffline() : false)
                .isSynced(!Boolean.TRUE.equals(request.isOffline()))
                .syncedAt(Boolean.TRUE.equals(request.isOffline()) ? null : Instant.now())
                .photos(new ArrayList<>())
                .build();

        // Agregar fotos si se proporcionaron (URLs pre-guardadas)
        if (request.photoUrls() != null && !request.photoUrls().isEmpty()) {
            for (String photoUrl : request.photoUrls()) {
                IncidentPhoto photo = IncidentPhoto.builder()
                        .incident(incident)
                        .photoUrl(photoUrl)
                        .build();
                incident.getPhotos().add(photo);
            }
        }

        Incident savedIncident = incidentRepository.save(incident);

        // Bloquear la habitación por incidencia
        room.setCurrentStatus(Room.RoomStatus.BLOQUEADA_INCIDENCIA);
        room.setLastStatusChange(Instant.now());
        roomRepository.save(room);

        // Enviar notificación a todos los administradores
        List<User> admins = userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.ADMIN)
                .toList();

        if (!admins.isEmpty()) {
            String notificationTitle = "Nueva incidencia reportada";
            String notificationBody = String.format("Habitación %s - Piso %s: %s",
                    room.getRoomNumber(), room.getFloor(), savedIncident.getTitle());
            notificationService.createAndSendNotificationToMultiple(
                    admins,
                    notificationTitle,
                    notificationBody,
                    Notification.NotificationType.INCIDENT
            );
        }

        return IncidentResponse.fromEntity(savedIncident);
    }

    @Transactional
    public IncidentResponse updateIncidentStatus(Long id, UpdateIncidentStatusRequest request) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Incidencia no encontrada"));

        incident.setStatus(request.status());

        // Si se resuelve la incidencia, actualizar fecha de resolución y estado de habitación
        if (request.status() == Incident.IncidentStatus.RESUELTA) {
            incident.setResolvedAt(Instant.now());

            // Obtener URLs de fotos antes de eliminar
            List<String> photoUrls = incident.getPhotos().stream()
                    .map(IncidentPhoto::getPhotoUrl)
                    .collect(Collectors.toList());

            // Eliminar archivos físicos de las fotos
            fileStorageService.deleteIncidentFiles(photoUrls);

            // Generar carpeta de la habitación
            Room room = incident.getRoom();
            String roomFolder = fileStorageService.generateRoomFolder(room.getFloor(), room.getRoomNumber());

            // Eliminar carpeta si está vacía
            fileStorageService.deleteRoomFolderIfEmpty(roomFolder);

            // Limpiar fotos de la base de datos
            incident.getPhotos().clear();

            // Cambiar estado de la habitación a PENDIENTE_LIMPIEZA
            room.setCurrentStatus(Room.RoomStatus.PENDIENTE_LIMPIEZA);
            room.setLastStatusChange(Instant.now());
            roomRepository.save(room);

            log.info("Incidencia {} resuelta. Fotos eliminadas. Habitación {} cambiada a PENDIENTE_LIMPIEZA",
                    id, room.getRoomNumber());
        }

        Incident updatedIncident = incidentRepository.save(incident);
        return IncidentResponse.fromEntity(updatedIncident);
    }

    @Transactional(readOnly = true)
    public List<IncidentResponse> getAllIncidents() {
        return incidentRepository.findAll()
                .stream()
                .map(IncidentResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public IncidentResponse getIncidentById(Long id) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Incidencia no encontrada"));
        return IncidentResponse.fromEntity(incident);
    }

    @Transactional(readOnly = true)
    public List<IncidentResponse> getIncidentsByRoom(Long roomId) {
        return incidentRepository.findByRoomId(roomId)
                .stream()
                .map(IncidentResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<IncidentResponse> getIncidentsByStatus(Incident.IncidentStatus status) {
        return incidentRepository.findByStatus(status)
                .stream()
                .map(IncidentResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<IncidentResponse> getPendingSyncIncidents() {
        return incidentRepository.findByIsSyncedFalse()
                .stream()
                .map(IncidentResponse::fromEntity)
                .toList();
    }
}
