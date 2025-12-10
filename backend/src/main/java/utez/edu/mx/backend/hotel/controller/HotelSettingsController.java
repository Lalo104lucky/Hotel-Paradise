package utez.edu.mx.backend.hotel.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import utez.edu.mx.backend.hotel.dto.HotelSettingsRequest;
import utez.edu.mx.backend.hotel.dto.HotelSettingsResponse;
import utez.edu.mx.backend.hotel.service.HotelSettingsService;

@RestController
@RequestMapping("/api/hotel-settings")
@RequiredArgsConstructor
public class HotelSettingsController {
    private final HotelSettingsService hotelSettingsService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_CAMARERA')")
    public ResponseEntity<HotelSettingsResponse> getSettings() {
        return ResponseEntity.ok(hotelSettingsService.getSettings());
    }

    @PutMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<HotelSettingsResponse> updateSettings(@Valid @RequestBody HotelSettingsRequest request) {
        return ResponseEntity.ok(hotelSettingsService.updateSettings(request));
    }
}
