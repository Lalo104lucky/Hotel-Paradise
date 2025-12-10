package utez.edu.mx.backend.auth.controller;

public record LoginRequest(
        String email,
        String password
) {
}
