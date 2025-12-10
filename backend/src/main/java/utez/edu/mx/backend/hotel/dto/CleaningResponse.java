package utez.edu.mx.backend.hotel.dto;

import utez.edu.mx.backend.hotel.model.Cleaning;

import java.time.Instant;

public record CleaningResponse(
        Long id,
        Long roomId,
        String roomNumber,
        Long cleanedByUserId,
        String cleanedByUserName,
        Instant cleaningDatetime,
        Cleaning.CleaningSource source,
        Boolean isOffline,
        Boolean isSynced,
        Instant syncedAt,
        Instant createdAt
) {
    public static CleaningResponse fromEntity(Cleaning cleaning) {
        return new CleaningResponse(
                cleaning.getId(),
                cleaning.getRoom().getId(),
                cleaning.getRoom().getRoomNumber(),
                cleaning.getCleanedByUser().getId(),
                cleaning.getCleanedByUser().getName(),
                cleaning.getCleaningDatetime(),
                cleaning.getSource(),
                cleaning.getIsOffline(),
                cleaning.getIsSynced(),
                cleaning.getSyncedAt(),
                cleaning.getCreatedAt()
        );
    }
}
