package utez.edu.mx.backend.hotel.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import utez.edu.mx.backend.User.model.User;
import utez.edu.mx.backend.User.model.UserRepository;
import utez.edu.mx.backend.hotel.dto.RoomAssignmentRequest;
import utez.edu.mx.backend.hotel.dto.RoomAssignmentResponse;
import utez.edu.mx.backend.hotel.model.Room;
import utez.edu.mx.backend.hotel.model.RoomAssignment;
import utez.edu.mx.backend.hotel.repository.RoomAssignmentRepository;
import utez.edu.mx.backend.hotel.repository.RoomRepository;
import utez.edu.mx.backend.notification.model.Notification;
import utez.edu.mx.backend.notification.service.NotificationService;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoomAssignmentService {
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<RoomAssignmentResponse> getAllActiveAssignments() {
        log.info("Obteniendo todas las asignaciones activas.");
        return roomAssignmentRepository.findByActiveTrue()
                .stream()
                .filter(assignment -> assignment.getRoom().getCurrentStatus() != Room.RoomStatus.LIMPIA)
                .map(RoomAssignmentResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RoomAssignmentResponse> getAssignmentsByUserId(Long userId) {
        log.info("Obteniendo asignaciones activas para el usuario ID: {}", userId);
        return roomAssignmentRepository.findByUserIdAndActiveTrue(userId)
                .stream()
                .filter(assignment -> assignment.getRoom().getCurrentStatus() != Room.RoomStatus.LIMPIA)
                .map(RoomAssignmentResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RoomAssignmentResponse> getAssignmentsByRoomId(Long roomId) {
        log.info("Obteniendo asignaciones activas para la habitación ID: {}", roomId);
        return roomAssignmentRepository.findByRoomIdAndActiveTrue(roomId)
                .stream()
                .map(RoomAssignmentResponse::fromEntity)
                .toList();
    }

    @Transactional
    public RoomAssignmentResponse createAssignment(RoomAssignmentRequest request) {
        log.info("Iniciando creación de asignación para la habitación ID: {} al usuario ID: {}", request.roomId(), request.userId());
        Room room = roomRepository.findById(request.roomId())
                .orElseThrow(() -> {
                    log.error("Error al crear asignación: Habitación no encontrada con ID: {}", request.roomId());
                    return new RuntimeException("Habitación no encontrada");
                });

        // Validar que la habitación no esté limpia (no tiene sentido asignar una tarea de limpieza a una habitación limpia)
        if (room.getCurrentStatus() == Room.RoomStatus.LIMPIA) {
            log.warn("Intento de asignar una tarea a una habitación que ya está limpia. Habitación ID: {}", request.roomId());
            throw new RuntimeException("No se puede asignar una tarea a una habitación que ya está limpia");
        }

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> {
                    log.error("Error al crear asignación: Usuario no encontrado con ID: {}", request.userId());
                    return new RuntimeException("Usuario no encontrado");
                });

        RoomAssignment assignment = RoomAssignment.builder()
                .room(room)
                .user(user)
                .active(true)
                .build();

        assignment = roomAssignmentRepository.save(assignment);
        log.info("Asignación creada con ID: {}", assignment.getId());

        // Enviar notificación a la camarera asignada
        log.info("Enviando notificación de nueva asignación al usuario: {}", user.getEmail());
        String notificationTitle = "Nueva asignación";
        String notificationBody = String.format("Se te ha asignado la habitación %s - Piso %s",
                room.getRoomNumber(), room.getFloor());
        notificationService.createAndSendNotification(
                user,
                notificationTitle,
                notificationBody,
                Notification.NotificationType.ASSIGNMENT
        );

        return RoomAssignmentResponse.fromEntity(assignment);
    }

    @Transactional
    public void deleteAssignment(Long id) {
        log.info("Iniciando desactivación de la asignación ID: {}", id);
        RoomAssignment assignment = roomAssignmentRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Error al desactivar asignación: Asignación no encontrada con ID: {}", id);
                    return new RuntimeException("Asignación no encontrada");
                });

        assignment.setActive(false);
        roomAssignmentRepository.save(assignment);
        log.info("Asignación ID: {} desactivada.", id);

        // Enviar notificación a la camarera cuando se elimina una asignación
        log.info("Enviando notificación de cancelación de asignación al usuario: {}", assignment.getUser().getEmail());
        String notificationTitle = "Asignación cancelada";
        String notificationBody = String.format("Se ha cancelado tu asignación de la habitación %s - Piso %s",
                assignment.getRoom().getRoomNumber(), assignment.getRoom().getFloor());
        notificationService.createAndSendNotification(
                assignment.getUser(),
                notificationTitle,
                notificationBody,
                Notification.NotificationType.UNASSIGNMENT
        );
    }

    @Transactional
    public void deleteAssignmentPermanently(Long id) {
        log.warn("Iniciando eliminación permanente de la asignación ID: {}", id);
        roomAssignmentRepository.deleteById(id);
        log.info("Asignación ID: {} eliminada permanentemente.", id);
    }
}
