package utez.edu.mx.backend.hotel.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import utez.edu.mx.backend.hotel.model.IncidentPhoto;

import java.util.List;

@Repository
public interface IncidentPhotoRepository extends JpaRepository<IncidentPhoto, Long> {
    List<IncidentPhoto> findByIncidentId(Long incidentId);
}
