package utez.edu.mx.backend.hotel.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "rooms")
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_number", nullable = false)
    private String roomNumber;

    @Column(name = "floor")
    private String floor;

    @Column(name = "barcode_value", unique = true)
    private String barcodeValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_status", nullable = false)
    @Builder.Default
    private RoomStatus currentStatus = RoomStatus.LIMPIA;

    @Column(name = "last_status_change")
    private Instant lastStatusChange;

    @Column(name = "scheduled_cleaning_time")
    private LocalTime scheduledCleaningTime;

    @Column(name = "notes")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public enum RoomStatus {
        EN_USO, PENDIENTE_LIMPIEZA, EN_LIMPIEZA, LIMPIA, BLOQUEADA_INCIDENCIA
    }
}
