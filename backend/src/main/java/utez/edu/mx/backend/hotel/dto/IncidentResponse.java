package utez.edu.mx.backend.hotel.dto;

import utez.edu.mx.backend.hotel.model.Incident;
import utez.edu.mx.backend.hotel.model.IncidentPhoto;

import java.time.Instant;
import java.util.List;

public record IncidentResponse(
        Long id,
        Long roomId,
        String roomNumber,
        Long reportedByUserId,
        String reportedByUserName,
        String title,
        String description,
        Incident.IncidentStatus status,
        Instant createdAt,
        Instant updatedAt,
        Instant resolvedAt,
        Boolean isOffline,
        Boolean isSynced,
        Instant syncedAt,
        List<String> photoUrls
) {
    public static IncidentResponse fromEntity(Incident incident) {
        List<String> photoUrls = incident.getPhotos() != null
                ? incident.getPhotos().stream()
                .map(IncidentPhoto::getPhotoUrl)
                .toList()
                : List.of();

        return new IncidentResponse(
                incident.getId(),
                incident.getRoom().getId(),
                incident.getRoom().getRoomNumber(),
                incident.getReportedByUser().getId(),
                incident.getReportedByUser().getName(),
                incident.getTitle(),
                incident.getDescription(),
                incident.getStatus(),
                incident.getCreatedAt(),
                incident.getUpdatedAt(),
                incident.getResolvedAt(),
                incident.getIsOffline(),
                incident.getIsSynced(),
                incident.getSyncedAt(),
                photoUrls
        );
    }
}
