package utez.edu.mx.backend.hotel.dto;

import utez.edu.mx.backend.hotel.model.RoomAssignment;

import java.time.Instant;

public record RoomAssignmentResponse(
        Long id,
        Long roomId,
        String roomNumber,
        String floor,
        String barcodeValue,
        String roomStatus,
        Long userId,
        String userName,
        String userEmail,
        Boolean active,
        Instant createdAt,
        Instant updatedAt
) {
    public static RoomAssignmentResponse fromEntity(RoomAssignment assignment) {
        return new RoomAssignmentResponse(
                assignment.getId(),
                assignment.getRoom().getId(),
                assignment.getRoom().getRoomNumber(),
                assignment.getRoom().getFloor(),
                assignment.getRoom().getBarcodeValue(),
                assignment.getRoom().getCurrentStatus().toString(),
                assignment.getUser().getId(),
                assignment.getUser().getName(),
                assignment.getUser().getEmail(),
                assignment.getActive(),
                assignment.getCreatedAt(),
                assignment.getUpdatedAt()
        );
    }
}
