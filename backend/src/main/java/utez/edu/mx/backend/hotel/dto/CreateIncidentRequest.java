package utez.edu.mx.backend.hotel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateIncidentRequest(
        @NotNull(message = "El ID de la habitación es requerido")
        Long roomId,

        @NotBlank(message = "El título es requerido")
        String title,

        String description,

        Boolean isOffline,

        List<String> photoUrls
) {}
