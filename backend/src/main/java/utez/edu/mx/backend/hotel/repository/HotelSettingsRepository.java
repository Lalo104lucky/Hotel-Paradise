package utez.edu.mx.backend.hotel.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import utez.edu.mx.backend.hotel.model.HotelSettings;

import java.util.Optional;

@Repository
public interface HotelSettingsRepository extends JpaRepository<HotelSettings, Long> {
    Optional<HotelSettings> findFirstByOrderByIdAsc();
}
