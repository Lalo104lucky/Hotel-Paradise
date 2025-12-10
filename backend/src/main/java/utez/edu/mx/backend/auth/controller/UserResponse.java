package utez.edu.mx.backend.auth.controller;

import com.fasterxml.jackson.annotation.JsonProperty;
import utez.edu.mx.backend.User.model.User;

public record UserResponse(
        Long id,
        String name,
        String email,

        @JsonProperty("rol") String role,

        boolean status
) {
    public static UserResponse fromEntity(User user) {
        String frontendRole = mapBackendRoleToFrontend(user.getRole());
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                frontendRole
                , user.isStatus()
        );
    }

    private static String mapBackendRoleToFrontend(User.Role role) {
        return switch (role) {
            case ADMIN -> "ADMIN_ROLE";
            case CAMARERA -> "USER_ROLE";
        };
    }
}
