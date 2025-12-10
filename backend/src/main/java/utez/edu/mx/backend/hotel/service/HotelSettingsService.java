package utez.edu.mx.backend.hotel.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import utez.edu.mx.backend.hotel.dto.HotelSettingsRequest;
import utez.edu.mx.backend.hotel.dto.HotelSettingsResponse;
import utez.edu.mx.backend.hotel.model.HotelSettings;
import utez.edu.mx.backend.hotel.model.Room;
import utez.edu.mx.backend.hotel.repository.HotelSettingsRepository;
import utez.edu.mx.backend.hotel.repository.RoomRepository;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class HotelSettingsService {
    private final HotelSettingsRepository hotelSettingsRepository;
    private final RoomRepository roomRepository;

    @Transactional(readOnly = true)
    public HotelSettingsResponse getSettings() {
        HotelSettings settings = hotelSettingsRepository.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new IllegalArgumentException("No se encontró configuración del hotel"));
        return HotelSettingsResponse.fromEntity(settings);
    }

    @Transactional
    public HotelSettingsResponse updateSettings(HotelSettingsRequest request) {
        HotelSettings settings = hotelSettingsRepository.findFirstByOrderByIdAsc()
                .orElse(HotelSettings.builder().build());

        settings.setCleaningStartTime(request.cleaningStartTime());
        if (request.allowOffline() != null) {
            settings.setAllowOffline(request.allowOffline());
        }

        HotelSettings savedSettings = hotelSettingsRepository.save(settings);

        List<Room> allRooms = roomRepository.findAll();
        int updatedCount = 0;

        for (Room room : allRooms) {
            room.setScheduledCleaningTime(request.cleaningStartTime());
            roomRepository.save(room);
            updatedCount++;
        }

        log.info("Horario por defecto actualizado a {}. Se actualizaron {} habitaciones",
                request.cleaningStartTime(), updatedCount);

        return HotelSettingsResponse.fromEntity(savedSettings);
    }
}
