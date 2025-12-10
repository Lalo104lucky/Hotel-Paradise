package utez.edu.mx.backend.hotel.dto;

import jakarta.validation.constraints.NotNull;
import utez.edu.mx.backend.hotel.model.Cleaning;

import java.time.Instant;

public record RegisterCleaningRequest(
        @NotNull(message = "El ID de la habitación es requerido")
        Long roomId,

        Instant cleaningDatetime,

        Cleaning.CleaningSource source,

        Boolean isOffline
) {}
