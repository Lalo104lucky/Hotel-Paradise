package utez.edu.mx.backend.User.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import utez.edu.mx.backend.User.model.UpdateStatusRequest;
import utez.edu.mx.backend.User.model.User;
import utez.edu.mx.backend.User.model.UserRepository;
import utez.edu.mx.backend.auth.controller.UserResponse;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;

    @GetMapping("/role/{role}")
    public ResponseEntity<List<UserResponse>> getUsersByRole(@PathVariable User.Role role) {
        List<User> users = userRepository.findByRole(role);
        List<UserResponse> response = users.stream()
                .map(UserResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<UserResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody UpdateStatusRequest request
    ) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        user.setStatus(request.status());
        User saved = userRepository.save(user);

        return ResponseEntity.ok(UserResponse.fromEntity(saved));
    }
}
