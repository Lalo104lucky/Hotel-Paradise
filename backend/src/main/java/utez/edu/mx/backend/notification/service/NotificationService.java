package utez.edu.mx.backend.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import utez.edu.mx.backend.User.model.User;
import utez.edu.mx.backend.notification.dto.NotificationDTO;
import utez.edu.mx.backend.notification.model.Notification;
import utez.edu.mx.backend.notification.repository.NotificationRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final FCMService fcmService;

    /**
     * Crea y envía una notificación a un usuario
     */
    @Transactional
    public void createAndSendNotification(User user, String title, String body, Notification.NotificationType type) {
        log.info("Creando notificación para el usuario: {} con título: {}", user.getEmail(), title);
        // Guardar notificación en la base de datos
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .body(body)
                .type(type)
                .isRead(false)
                .build();
        notificationRepository.save(notification);
        log.debug("Notificación guardada en la base de datos con ID: {}", notification.getId());

        // Enviar notificación push si el usuario tiene FCM token
        if (user.getFcmToken() != null && !user.getFcmToken().isEmpty()) {
            Map<String, String> data = new HashMap<>();
            data.put("type", type.name());
            data.put("notificationId", notification.getId().toString());

            fcmService.sendNotification(user.getFcmToken(), title, body, data);
            log.info("Notificación push enviada a: {}", user.getEmail());
        } else {
            log.warn("El usuario {} no tiene un token FCM, no se envió la notificación push.", user.getEmail());
        }
    }

    /**
     * Crea y envía notificaciones a múltiples usuarios
     */
    @Transactional
    public void createAndSendNotificationToMultiple(List<User> users, String title, String body, Notification.NotificationType type) {
        log.info("Creando notificación para {} usuarios con título: {}", users.size(), title);
        // Guardar notificaciones en la base de datos
        List<Notification> notifications = users.stream()
                .map(user -> Notification.builder()
                        .user(user)
                        .title(title)
                        .body(body)
                        .type(type)
                        .isRead(false)
                        .build())
                .toList();
        notificationRepository.saveAll(notifications);
        log.debug("{} notificaciones guardadas en la base de datos.", notifications.size());

        // Enviar notificaciones push
        List<String> fcmTokens = users.stream()
                .map(User::getFcmToken)
                .filter(token -> token != null && !token.isEmpty())
                .toList();

        if (!fcmTokens.isEmpty()) {
            Map<String, String> data = new HashMap<>();
            data.put("type", type.name());

            fcmService.sendNotificationToMultiple(fcmTokens, title, body, data);
            log.info("Notificaciones push enviadas a {} usuarios.", fcmTokens.size());
        } else {
            log.warn("Ninguno de los usuarios tiene un token FCM, no se enviaron notificaciones push.");
        }
    }

    /**
     * Obtiene todas las notificaciones de un usuario
     */
    public List<NotificationDTO> getUserNotifications(User user) {
        log.debug("Obteniendo todas las notificaciones para el usuario: {}", user.getEmail());
        return notificationRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(NotificationDTO::fromEntity)
                .toList();
    }

    /**
     * Obtiene las notificaciones no leídas de un usuario
     */
    public List<NotificationDTO> getUnreadNotifications(User user) {
        log.debug("Obteniendo notificaciones no leídas para el usuario: {}", user.getEmail());
        return notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user)
                .stream()
                .map(NotificationDTO::fromEntity)
                .toList();
    }

    /**
     * Marca una notificación como leída
     */
    @Transactional
    public void markAsRead(Long notificationId) {
        log.info("Marcando notificación con ID: {} como leída.", notificationId);
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
            log.debug("Notificación con ID: {} marcada como leída.", notificationId);
        });
    }

    /**
     * Marca todas las notificaciones de un usuario como leídas
     */
    @Transactional
    public void markAllAsRead(User user) {
        log.info("Marcando todas las notificaciones como leídas para el usuario: {}", user.getEmail());
        List<Notification> unreadNotifications = notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user);
        unreadNotifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(unreadNotifications);
        log.info("Se marcaron {} notificaciones como leídas para: {}", unreadNotifications.size(), user.getEmail());
    }

    /**
     * Cuenta las notificaciones no leídas de un usuario
     */
    public long countUnreadNotifications(User user) {
        log.debug("Contando notificaciones no leídas para el usuario: {}", user.getEmail());
        return notificationRepository.countByUserAndIsReadFalse(user);
    }

    /**
     * Elimina una notificación si pertenece al usuario
     */
    @Transactional
    public void deleteNotification(Long notificationId, User user) {
        log.info("Usuario {} intenta eliminar la notificación con ID: {}", user.getEmail(), notificationId);
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            // Verificar que la notificación pertenece al usuario
            if (notification.getUser().getId().equals(user.getId())) {
                notificationRepository.delete(notification);
                log.info("Notificación con ID: {} eliminada exitosamente.", notificationId);
            } else {
                log.warn("El usuario {} no tiene permiso para eliminar la notificación con ID: {}", user.getEmail(), notificationId);
                throw new RuntimeException("No tienes permiso para eliminar esta notificación");
            }
        });
    }
}
