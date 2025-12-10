package utez.edu.mx.backend.hotel.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import utez.edu.mx.backend.hotel.model.RoomAssignment;

import java.util.List;

@Repository
public interface RoomAssignmentRepository extends JpaRepository<RoomAssignment, Long> {
    List<RoomAssignment> findByUserIdAndActiveTrue(Long userId);
    List<RoomAssignment> findByRoomIdAndActiveTrue(Long roomId);
    List<RoomAssignment> findByActiveTrue();
}
