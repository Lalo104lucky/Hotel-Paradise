package utez.edu.mx.backend.auth.controller;

import utez.edu.mx.backend.User.model.User;

public record RegisterRequest(
        String name,
        String email,
        String password,
        User.Role role
) {
}
