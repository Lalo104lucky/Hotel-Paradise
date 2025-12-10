package utez.edu.mx.backend.hotel.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import utez.edu.mx.backend.hotel.model.Incident;

import java.util.List;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {
    List<Incident> findByRoomId(Long roomId);
    List<Incident> findByReportedByUserId(Long userId);
    List<Incident> findByStatus(Incident.IncidentStatus status);
    List<Incident> findByIsOfflineTrue();
    List<Incident> findByIsSyncedFalse();
}
