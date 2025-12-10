package utez.edu.mx.backend.hotel.dto;

import utez.edu.mx.backend.hotel.model.HotelSettings;

import java.time.Instant;
import java.time.LocalTime;

public record HotelSettingsResponse(
        Long id,
        LocalTime cleaningStartTime,
        Boolean allowOffline,
        Instant createdAt,
        Instant updatedAt
) {
    public static HotelSettingsResponse fromEntity(HotelSettings settings) {
        return new HotelSettingsResponse(
                settings.getId(),
                settings.getCleaningStartTime(),
                settings.getAllowOffline(),
                settings.getCreatedAt(),
                settings.getUpdatedAt()
        );
    }
}
