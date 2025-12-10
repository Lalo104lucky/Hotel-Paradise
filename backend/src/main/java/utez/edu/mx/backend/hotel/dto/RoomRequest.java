package utez.edu.mx.backend.hotel.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalTime;

public record RoomRequest(
        @NotBlank(message = "El número de habitación es requerido")
        String roomNumber,

        String floor,

        String barcodeValue,

        LocalTime scheduledCleaningTime,

        String notes
) {}
