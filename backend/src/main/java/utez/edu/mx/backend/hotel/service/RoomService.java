package utez.edu.mx.backend.hotel.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import utez.edu.mx.backend.hotel.dto.RoomRequest;
import utez.edu.mx.backend.hotel.dto.RoomResponse;
import utez.edu.mx.backend.hotel.dto.UpdateRoomStatusRequest;
import utez.edu.mx.backend.hotel.model.HotelSettings;
import utez.edu.mx.backend.hotel.model.Room;
import utez.edu.mx.backend.hotel.repository.HotelSettingsRepository;
import utez.edu.mx.backend.hotel.repository.RoomAssignmentRepository;
import utez.edu.mx.backend.hotel.repository.RoomRepository;

import java.time.Instant;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoomService {
    private final RoomRepository roomRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final HotelSettingsRepository hotelSettingsRepository;

    @Transactional(readOnly = true)
    public List<RoomResponse> getAllRooms() {
        log.info("Obteniendo todas las habitaciones.");
        return roomRepository.findAll()
                .stream()
                .map(RoomResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public RoomResponse getRoomById(Long id) {
        log.info("Obteniendo habitación por ID: {}", id);
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Habitación no encontrada con ID: {}", id);
                    return new IllegalArgumentException("Habitación no encontrada");
                });
        return RoomResponse.fromEntity(room);
    }

    @Transactional
    public RoomResponse createRoom(RoomRequest request) {
        log.info("Iniciando creación de nueva habitación con número: {}", request.roomNumber());
        LocalTime defaultCleaningTime = hotelSettingsRepository.findAll()
                .stream()
                .findFirst()
                .map(HotelSettings::getCleaningStartTime)
                .orElse(LocalTime.of(14, 0));

        LocalTime cleaningTime = request.scheduledCleaningTime() != null
                ? request.scheduledCleaningTime()
                : defaultCleaningTime;

        Room room = Room.builder()
                .roomNumber(request.roomNumber())
                .floor(request.floor())
                .barcodeValue(request.barcodeValue())
                .scheduledCleaningTime(cleaningTime)
                .notes(request.notes())
                .currentStatus(Room.RoomStatus.LIMPIA)
                .lastStatusChange(Instant.now())
                .build();

        Room savedRoom = roomRepository.save(room);
        log.info("Habitación creada exitosamente con ID: {}", savedRoom.getId());
        return RoomResponse.fromEntity(savedRoom);
    }

    @Transactional
    public RoomResponse updateRoom(Long id, RoomRequest request) {
        log.info("Iniciando actualización de la habitación ID: {}", id);
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Error al actualizar: Habitación no encontrada con ID: {}", id);
                    return new IllegalArgumentException("Habitación no encontrada");
                });

        room.setRoomNumber(request.roomNumber());
        room.setFloor(request.floor());
        room.setBarcodeValue(request.barcodeValue());
        room.setScheduledCleaningTime(request.scheduledCleaningTime());
        room.setNotes(request.notes());

        Room updatedRoom = roomRepository.save(room);
        log.info("Habitación ID: {} actualizada exitosamente.", id);
        return RoomResponse.fromEntity(updatedRoom);
    }

    @Transactional
    public void deleteRoom(Long id) {
        log.warn("Iniciando eliminación de la habitación ID: {}", id);
        if (!roomRepository.existsById(id)) {
            log.error("Error al eliminar: Habitación no encontrada con ID: {}", id);
            throw new IllegalArgumentException("Habitación no encontrada");
        }
        roomRepository.deleteById(id);
        log.info("Habitación ID: {} eliminada exitosamente.", id);
    }

    @Transactional
    public RoomResponse updateRoomStatus(Long id, UpdateRoomStatusRequest request) {
        log.info("Iniciando actualización de estado para la habitación ID: {} a {}", id, request.status());
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Error al actualizar estado: Habitación no encontrada con ID: {}", id);
                    return new IllegalArgumentException("Habitación no encontrada");
                });

        room.setCurrentStatus(request.status());
        room.setLastStatusChange(Instant.now());

        Room updatedRoom = roomRepository.save(room);
        log.info("Estado de la habitación ID: {} actualizado a {}.", id, request.status());

        // Si la habitación se marca como LIMPIA, desactivar automáticamente sus asignaciones activas
        if (request.status() == Room.RoomStatus.LIMPIA) {
            log.info("La habitación ID: {} se marcó como LIMPIA. Desactivando asignaciones activas.", id);
            roomAssignmentRepository.findByRoomIdAndActiveTrue(id)
                    .forEach(assignment -> {
                        assignment.setActive(false);
                        roomAssignmentRepository.save(assignment);
                        log.debug("Asignación ID: {} desactivada para la habitación ID: {}", assignment.getId(), id);
                    });
        }

        return RoomResponse.fromEntity(updatedRoom);
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> getRoomsByStatus(Room.RoomStatus status) {
        log.info("Obteniendo habitaciones con estado: {}", status);
        return roomRepository.findByCurrentStatus(status)
                .stream()
                .map(RoomResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> getRoomsByFloor(String floor) {
        log.info("Obteniendo habitaciones del piso: {}", floor);
        return roomRepository.findByFloor(floor)
                .stream()
                .map(RoomResponse::fromEntity)
                .toList();
    }
}
