package utez.edu.mx.backend.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import utez.edu.mx.backend.User.model.User;
import utez.edu.mx.backend.User.model.UserRepository;
import utez.edu.mx.backend.auth.controller.LoginRequest;
import utez.edu.mx.backend.auth.controller.RegisterRequest;
import utez.edu.mx.backend.auth.controller.RegisterCamareraRequest;
import utez.edu.mx.backend.auth.controller.TokenResponse;
import utez.edu.mx.backend.auth.controller.UserResponse;
import utez.edu.mx.backend.auth.repository.Token;
import utez.edu.mx.backend.auth.repository.TokenRespository;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    private final UserRepository userRepository;
    private final TokenRespository tokenRespository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private  UserResponse userResponse;

    public TokenResponse register(RegisterRequest request){
        log.info("Iniciando registro para el usuario: {}", request.email());
        var user = User.builder()
                .name(request.name())
                .email(request.email())
                .status(true)
                .password(passwordEncoder.encode(request.password()))
                .role(request.role() != null ? request.role() : User.Role.CAMARERA)
                .build();
        var savedUser = userRepository.save(user);
        var jwtToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);
        savedUserToken(savedUser, jwtToken);
        log.info("Usuario registrado exitosamente: {}", savedUser.getEmail());
        return new TokenResponse(jwtToken, refreshToken, UserResponse.fromEntity(savedUser));
    }

    public TokenResponse registerCamarera(RegisterCamareraRequest request){
        log.info("Iniciando registro para camarera: {}", request.email());
        var user = User.builder()
                .name(request.name())
                .email(request.email())
                .status(true)
                .password(passwordEncoder.encode(request.password()))
                .role(User.Role.CAMARERA)
                .build();
        var savedUser = userRepository.save(user);
        var jwtToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);
        savedUserToken(savedUser, jwtToken);
        log.info("Camarera registrada exitosamente: {}", savedUser.getEmail());
        return new TokenResponse(jwtToken, refreshToken, UserResponse.fromEntity(savedUser));
    }

    public TokenResponse login(LoginRequest request){
        log.info("Intento de inicio de sesión para: {}", request.email());
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()
                )
        );
        var user = userRepository.findByEmail(request.email())
                .orElseThrow();
        var jwtToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);
        revokeAllUserTokens(user);
        savedUserToken(user, jwtToken);
        log.info("Inicio de sesión exitoso para: {}", user.getEmail());
        return new TokenResponse(jwtToken, refreshToken, UserResponse.fromEntity(user));
    }

    public void savedUserToken(User user, String jwtToken) {
        log.debug("Guardando token para el usuario: {}", user.getEmail());
        var token = Token.builder()
                .user(user)
                .token(jwtToken)
                .tokenType(Token.TokenType.BEARER)
                .expired(false)
                .revoked(false)
                .build();
        tokenRespository.save(token);
    }

    public void revokeAllUserTokens(final User user){
        log.info("Revocando todos los tokens para el usuario: {}", user.getEmail());
        final List<Token> validUserTokens = tokenRespository.findAllByUserIdAndExpiredFalseAndRevokedFalse(user.getId());
        if(!validUserTokens.isEmpty()){
            for (final Token token : validUserTokens) {
                token.setExpired(true);
                token.setRevoked(true);
            }
            tokenRespository.saveAll(validUserTokens);
            log.info("Tokens revocados para: {}. Total: {}", user.getEmail(), validUserTokens.size());
        }
    }

    public TokenResponse refreshToken(final String authHeader){
        log.info("Solicitud de actualización de token recibida.");
        if(authHeader == null || !authHeader.startsWith("Bearer ")){
            log.warn("Intento de actualización de token sin encabezado 'Bearer '.");
            throw new IllegalArgumentException("Invalid Bearer token");
        }

        final String refreshToken = authHeader.substring(7);
        final String userEmail = jwtService.extractUsername(refreshToken);

        if(userEmail == null){
            log.error("No se pudo extraer el email del token de actualización.");
            throw new IllegalArgumentException("Invalid Refresh token");
        }

        final User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException(userEmail));

        if(!jwtService.isTokenValid(refreshToken, user)){
            log.warn("Token de actualización inválido para el usuario: {}", userEmail);
            throw new IllegalArgumentException("Invalid Refresh token");
        }

        final String accessToken = jwtService.generateToken(user);
        revokeAllUserTokens(user);
        savedUserToken(user, accessToken);
        log.info("Token de acceso actualizado para: {}", user.getEmail());
        return new TokenResponse(accessToken, refreshToken, UserResponse.fromEntity(user));
    }

    public void logout(final String authHeader) {
        log.info("Solicitud de cierre de sesión recibida.");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("Intento de cierre de sesión sin encabezado 'Bearer '.");
            throw new IllegalArgumentException("Token No Encontrado");
        }

        final String jwtToken = authHeader.substring(7);
        final Token foundToken = tokenRespository.findByToken(jwtToken)
                .orElseThrow(() -> new IllegalArgumentException("Token No Encontrado"));
        foundToken.setExpired(true);
        foundToken.setRevoked(true);
        tokenRespository.save(foundToken);
        log.info("Cierre de sesión exitoso para el usuario: {}", foundToken.getUser().getEmail());
    }

    public void updateFcmToken(User user, String fcmToken) {
        log.info("Actualizando token FCM para el usuario: {}", user.getEmail());
        user.setFcmToken(fcmToken);
        userRepository.save(user);
        log.info("Token FCM actualizado exitosamente para: {}", user.getEmail());
    }

}
