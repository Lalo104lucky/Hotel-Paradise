package utez.edu.mx.backend.hotel.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import utez.edu.mx.backend.hotel.dto.RoomAssignmentRequest;
import utez.edu.mx.backend.hotel.dto.RoomAssignmentResponse;
import utez.edu.mx.backend.hotel.service.RoomAssignmentService;

import java.util.List;

@RestController
@RequestMapping("/api/room-assignments")
@RequiredArgsConstructor
public class RoomAssignmentController {
    private final RoomAssignmentService roomAssignmentService;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<RoomAssignmentResponse>> getAllActiveAssignments() {
        return ResponseEntity.ok(roomAssignmentService.getAllActiveAssignments());
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_CAMARERA')")
    public ResponseEntity<List<RoomAssignmentResponse>> getAssignmentsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(roomAssignmentService.getAssignmentsByUserId(userId));
    }

    @GetMapping("/room/{roomId}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<RoomAssignmentResponse>> getAssignmentsByRoomId(@PathVariable Long roomId) {
        return ResponseEntity.ok(roomAssignmentService.getAssignmentsByRoomId(roomId));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<RoomAssignmentResponse> createAssignment(@Valid @RequestBody RoomAssignmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(roomAssignmentService.createAssignment(request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteAssignment(@PathVariable Long id) {
        roomAssignmentService.deleteAssignment(id);
        return ResponseEntity.noContent().build();
    }
}
