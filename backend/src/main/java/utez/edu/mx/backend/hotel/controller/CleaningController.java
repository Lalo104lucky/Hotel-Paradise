package utez.edu.mx.backend.hotel.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import utez.edu.mx.backend.hotel.dto.CleaningResponse;
import utez.edu.mx.backend.hotel.dto.RegisterCleaningRequest;
import utez.edu.mx.backend.hotel.service.CleaningService;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/cleanings")
@RequiredArgsConstructor
public class CleaningController {
    private final CleaningService cleaningService;

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_CAMARERA')")
    public ResponseEntity<CleaningResponse> registerCleaning(@Valid @RequestBody RegisterCleaningRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cleaningService.registerCleaning(request));
    }

    @GetMapping("/room/{roomId}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<CleaningResponse>> getCleaningsByRoom(@PathVariable Long roomId) {
        return ResponseEntity.ok(cleaningService.getCleaningsByRoom(roomId));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<CleaningResponse>> getCleaningsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(cleaningService.getCleaningsByUser(userId));
    }

    @GetMapping("/date-range")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<CleaningResponse>> getCleaningsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant end
    ) {
        return ResponseEntity.ok(cleaningService.getCleaningsByDateRange(start, end));
    }

    @GetMapping("/pending-sync")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<CleaningResponse>> getPendingSyncCleanings() {
        return ResponseEntity.ok(cleaningService.getPendingSyncCleanings());
    }
}
