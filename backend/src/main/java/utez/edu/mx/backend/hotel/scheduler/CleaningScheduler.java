package utez.edu.mx.backend.hotel.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import utez.edu.mx.backend.hotel.model.Room;
import utez.edu.mx.backend.hotel.repository.RoomRepository;

import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class CleaningScheduler {
    private final RoomRepository roomRepository;

    /**
     * Tarea programada que se ejecuta cada minuto para verificar si alguna habitación
     * debe cambiar su estado a PENDIENTE_LIMPIEZA basándose en su horario programado.
     *
     * Cambia el estado de habitaciones que están EN_USO o LIMPIA.
     * NO cambia habitaciones BLOQUEADAS, EN_LIMPIEZA o que ya están PENDIENTE_LIMPIEZA.
     */
    //Ejecutar cada 15 segundos para pruebas
    @Scheduled(fixedRate = 15000)
    @Transactional
    public void checkAndUpdateRoomStatuses() {
        LocalTime currentTime = LocalTime.now();

        List<Room> roomsInUse = roomRepository.findByCurrentStatus(Room.RoomStatus.EN_USO);
        List<Room> cleanRooms = roomRepository.findByCurrentStatus(Room.RoomStatus.LIMPIA);

        List<Room> roomsToCheck = new java.util.ArrayList<>();
        roomsToCheck.addAll(roomsInUse);
        roomsToCheck.addAll(cleanRooms);

        for (Room room : roomsToCheck) {
            if (room.getScheduledCleaningTime() != null) {
                LocalTime scheduledTime = room.getScheduledCleaningTime();


                if (currentTime.isAfter(scheduledTime) || currentTime.equals(scheduledTime)) {
                    boolean needsUpdate = room.getLastStatusChange() == null ||
                            !isToday(room.getLastStatusChange()) ||
                            (isToday(room.getLastStatusChange()) &&
                             getLocalTimeFromInstant(room.getLastStatusChange()).isBefore(scheduledTime));

                    if (needsUpdate) {
                        log.info("Cambiando habitación {} de {} a PENDIENTE_LIMPIEZA (horario programado: {})",
                                room.getRoomNumber(), room.getCurrentStatus(), scheduledTime);

                        room.setCurrentStatus(Room.RoomStatus.PENDIENTE_LIMPIEZA);
                        room.setLastStatusChange(Instant.now());
                        roomRepository.save(room);
                    }
                }
            }
        }
    }

    private boolean isToday(Instant instant) {
        return instant.atZone(ZoneId.systemDefault()).toLocalDate()
                .equals(java.time.LocalDate.now());
    }

    private LocalTime getLocalTimeFromInstant(Instant instant) {
        return instant.atZone(ZoneId.systemDefault()).toLocalTime();
    }
}
