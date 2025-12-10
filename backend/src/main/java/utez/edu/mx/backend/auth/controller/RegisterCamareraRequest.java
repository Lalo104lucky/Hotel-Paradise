package utez.edu.mx.backend.auth.controller;

public record RegisterCamareraRequest(
        String name,
        String email,
        String password
) {
}
