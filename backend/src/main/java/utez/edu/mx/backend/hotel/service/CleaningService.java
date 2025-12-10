package utez.edu.mx.backend.hotel.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import utez.edu.mx.backend.User.model.User;
import utez.edu.mx.backend.User.model.UserRepository;
import utez.edu.mx.backend.hotel.dto.CleaningResponse;
import utez.edu.mx.backend.hotel.dto.RegisterCleaningRequest;
import utez.edu.mx.backend.hotel.model.Cleaning;
import utez.edu.mx.backend.hotel.model.Room;
import utez.edu.mx.backend.hotel.repository.CleaningRepository;
import utez.edu.mx.backend.hotel.repository.RoomRepository;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CleaningService {
    private final CleaningRepository cleaningRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    @Transactional
    public CleaningResponse registerCleaning(RegisterCleaningRequest request) {
        log.info("Iniciando registro de limpieza para la habitación ID: {}", request.roomId());
        // Obtener usuario autenticado directamente del contexto de seguridad
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        log.debug("Usuario autenticado: {}", user.getEmail());

        // Verificar que la habitación existe
        Room room = roomRepository.findById(request.roomId())
                .orElseThrow(() -> {
                    log.error("Intento de registrar limpieza para habitación no encontrada. ID: {}", request.roomId());
                    return new IllegalArgumentException("Habitación no encontrada");
                });

        // Crear registro de limpieza
        Cleaning cleaning = Cleaning.builder()
                .room(room)
                .cleanedByUser(user)
                .cleaningDatetime(request.cleaningDatetime() != null ? request.cleaningDatetime() : Instant.now())
                .source(request.source() != null ? request.source() : Cleaning.CleaningSource.SCAN)
                .isOffline(request.isOffline() != null ? request.isOffline() : false)
                .isSynced(!Boolean.TRUE.equals(request.isOffline()))
                .syncedAt(Boolean.TRUE.equals(request.isOffline()) ? null : Instant.now())
                .build();

        Cleaning savedCleaning = cleaningRepository.save(cleaning);
        log.info("Registro de limpieza guardado con ID: {}", savedCleaning.getId());

        // Actualizar estado de la habitación a LIMPIA
        room.setCurrentStatus(Room.RoomStatus.LIMPIA);
        room.setLastStatusChange(Instant.now());
        roomRepository.save(room);
        log.info("Estado de la habitación ID: {} actualizado a LIMPIA", room.getId());

        return CleaningResponse.fromEntity(savedCleaning);
    }

    @Transactional(readOnly = true)
    public List<CleaningResponse> getCleaningsByRoom(Long roomId) {
        log.debug("Obteniendo registros de limpieza para la habitación ID: {}", roomId);
        return cleaningRepository.findByRoomId(roomId)
                .stream()
                .map(CleaningResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CleaningResponse> getCleaningsByUser(Long userId) {
        log.debug("Obteniendo registros de limpieza para el usuario ID: {}", userId);
        return cleaningRepository.findByCleanedByUserId(userId)
                .stream()
                .map(CleaningResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CleaningResponse> getCleaningsByDateRange(Instant start, Instant end) {
        log.debug("Obteniendo registros de limpieza entre {} y {}", start, end);
        return cleaningRepository.findByCleaningDatetimeBetween(start, end)
                .stream()
                .map(CleaningResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CleaningResponse> getPendingSyncCleanings() {
        log.debug("Obteniendo registros de limpieza pendientes de sincronización");
        return cleaningRepository.findByIsSyncedFalse()
                .stream()
                .map(CleaningResponse::fromEntity)
                .toList();
    }
}
