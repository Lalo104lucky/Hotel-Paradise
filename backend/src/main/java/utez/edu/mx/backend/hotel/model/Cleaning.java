package utez.edu.mx.backend.hotel.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import utez.edu.mx.backend.User.model.User;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "cleanings")
public class Cleaning {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cleaned_by_user_id", nullable = false)
    private User cleanedByUser;

    @Column(name = "cleaning_datetime", nullable = false)
    private Instant cleaningDatetime;

    @Enumerated(EnumType.STRING)
    @Column(name = "source")
    @Builder.Default
    private CleaningSource source = CleaningSource.SCAN;

    @Column(name = "is_offline")
    @Builder.Default
    private Boolean isOffline = false;

    @Column(name = "is_synced")
    @Builder.Default
    private Boolean isSynced = true;

    @Column(name = "synced_at")
    private Instant syncedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public enum CleaningSource {
        SCAN, MANUAL
    }
}
