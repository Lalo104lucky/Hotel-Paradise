package utez.edu.mx.backend.hotel.dto;

import jakarta.validation.constraints.NotNull;
import utez.edu.mx.backend.hotel.model.Room;

public record UpdateRoomStatusRequest(
        @NotNull(message = "El estado es requerido")
        Room.RoomStatus status
) {}
