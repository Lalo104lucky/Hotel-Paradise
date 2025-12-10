package utez.edu.mx.backend.hotel.dto;

import jakarta.validation.constraints.NotNull;

public record RoomAssignmentRequest(
        @NotNull(message = "El ID de habitación es requerido")
        Long roomId,

        @NotNull(message = "El ID de usuario es requerido")
        Long userId
) {}
