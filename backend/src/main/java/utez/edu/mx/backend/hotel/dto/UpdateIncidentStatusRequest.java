package utez.edu.mx.backend.hotel.dto;

import jakarta.validation.constraints.NotNull;
import utez.edu.mx.backend.hotel.model.Incident;

public record UpdateIncidentStatusRequest(
        @NotNull(message = "El estado es requerido")
        Incident.IncidentStatus status
) {}
