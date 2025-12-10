package utez.edu.mx.backend.hotel.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

public record HotelSettingsRequest(
        @NotNull(message = "La hora de inicio de limpieza es requerida")
        LocalTime cleaningStartTime,

        Boolean allowOffline
) {}
