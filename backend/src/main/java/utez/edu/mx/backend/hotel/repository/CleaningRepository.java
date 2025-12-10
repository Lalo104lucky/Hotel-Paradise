package utez.edu.mx.backend.hotel.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import utez.edu.mx.backend.hotel.model.Cleaning;

import java.time.Instant;
import java.util.List;

@Repository
public interface CleaningRepository extends JpaRepository<Cleaning, Long> {
    List<Cleaning> findByRoomId(Long roomId);
    List<Cleaning> findByCleanedByUserId(Long userId);
    List<Cleaning> findByCleaningDatetimeBetween(Instant start, Instant end);
    List<Cleaning> findByIsOfflineTrue();
    List<Cleaning> findByIsSyncedFalse();
}
