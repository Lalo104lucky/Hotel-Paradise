package utez.edu.mx.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import utez.edu.mx.backend.User.model.User;
import utez.edu.mx.backend.User.model.UserRepository;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        initializeUsers();
    }

    private void initializeUsers() {
        // Crear usuario administrador/recepción si no existe
        if (userRepository.findByEmail("admin@hotel.com").isEmpty()) {
            User admin = User.builder()
                    .name("Administrador/Recepción")
                    .email("admin@hotel.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(User.Role.ADMIN)
                    .status(true)
                    .build();
            userRepository.save(admin);
            log.info("Usuario admin/recepción creado: admin@hotel.com / admin123");
        }

        // Crear usuario camarera si no existe
        if (userRepository.findByEmail("camarera@hotel.com").isEmpty()) {
            User camarera = User.builder()
                    .name("María García")
                    .email("camarera@hotel.com")
                    .password(passwordEncoder.encode("camarera123"))
                    .status(true)
                    .role(User.Role.CAMARERA)
                    .build();
            userRepository.save(camarera);
            log.info("Usuario camarera creado: camarera@hotel.com / camarera123");
        }

        log.info("Inicialización de datos completada");
    }
}
