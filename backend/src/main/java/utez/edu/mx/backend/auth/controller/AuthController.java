package utez.edu.mx.backend.auth.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import utez.edu.mx.backend.User.model.User;
import utez.edu.mx.backend.auth.service.AuthService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService service;

    @PostMapping("/register")
    public ResponseEntity<TokenResponse> register(@RequestBody final RegisterRequest request) {
        final TokenResponse token = service.register(request);
        return ResponseEntity.ok(token);
    }

    @PostMapping("/register-camarera")
    public ResponseEntity<TokenResponse> registerCamarera(@RequestBody final RegisterCamareraRequest request) {
        final TokenResponse token = service.registerCamarera(request);
        return ResponseEntity.ok(token);
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@RequestBody final LoginRequest request) {
        final TokenResponse token = service.login(request);
        return ResponseEntity.ok(token);
    }

    @PostMapping("/refresh")
    public TokenResponse refreshToken(@RequestHeader(HttpHeaders.AUTHORIZATION) final String authHeader) {
        return service.refreshToken(authHeader);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(HttpHeaders.AUTHORIZATION) final String authHeader) {
        service.logout(authHeader);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/fcm-token")
    public ResponseEntity<Map<String, String>> updateFcmToken(
            @AuthenticationPrincipal User user,
            @RequestBody UpdateFcmTokenRequest request) {
        service.updateFcmToken(user, request.fcmToken());
        Map<String, String> response = new HashMap<>();
        response.put("message", "FCM token actualizado exitosamente");
        return ResponseEntity.ok(response);
    }

}
