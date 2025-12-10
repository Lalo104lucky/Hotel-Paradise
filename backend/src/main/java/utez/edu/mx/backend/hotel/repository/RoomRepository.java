package utez.edu.mx.backend.hotel.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import utez.edu.mx.backend.hotel.model.Room;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByRoomNumber(String roomNumber);
    Optional<Room> findByBarcodeValue(String barcodeValue);
    List<Room> findByCurrentStatus(Room.RoomStatus status);
    List<Room> findByFloor(String floor);
}
