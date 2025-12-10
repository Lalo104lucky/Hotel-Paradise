package utez.edu.mx.backend.hotel.dto;

import utez.edu.mx.backend.hotel.model.Room;

import java.time.Instant;
import java.time.LocalTime;

public record RoomResponse(
        Long id,
        String roomNumber,
        String floor,
        String barcodeValue,
        Room.RoomStatus currentStatus,
        Instant lastStatusChange,
        LocalTime scheduledCleaningTime,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static RoomResponse fromEntity(Room room) {
        return new RoomResponse(
                room.getId(),
                room.getRoomNumber(),
                room.getFloor(),
                room.getBarcodeValue(),
                room.getCurrentStatus(),
                room.getLastStatusChange(),
                room.getScheduledCleaningTime(),
                room.getNotes(),
                room.getCreatedAt(),
                room.getUpdatedAt()
        );
    }
}
