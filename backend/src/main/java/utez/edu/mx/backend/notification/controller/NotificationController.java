package utez.edu.mx.backend.notification.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import utez.edu.mx.backend.User.model.User;
import utez.edu.mx.backend.notification.dto.NotificationDTO;
import utez.edu.mx.backend.notification.service.NotificationService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Obtiene todas las notificaciones del usuario autenticado
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getMyNotifications(@AuthenticationPrincipal User user) {
        List<NotificationDTO> notifications = notificationService.getUserNotifications(user);
        long unreadCount = notificationService.countUnreadNotifications(user);

        Map<String, Object> response = new HashMap<>();
        response.put("notifications", notifications);
        response.put("unreadCount", unreadCount);

        return ResponseEntity.ok(response);
    }

    /**
     * Obtiene solo las notificaciones no leídas
     */
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications(@AuthenticationPrincipal User user) {
        List<NotificationDTO> notifications = notificationService.getUnreadNotifications(user);
        return ResponseEntity.ok(notifications);
    }

    /**
     * Cuenta las notificaciones no leídas
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal User user) {
        long count = notificationService.countUnreadNotifications(user);
        Map<String, Long> response = new HashMap<>();
        response.put("count", count);
        return ResponseEntity.ok(response);
    }

    /**
     * Marca una notificación como leída
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Notificación marcada como leída");
        return ResponseEntity.ok(response);
    }

    /**
     * Marca todas las notificaciones como leídas
     */
    @PutMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead(@AuthenticationPrincipal User user) {
        notificationService.markAllAsRead(user);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Todas las notificaciones marcadas como leídas");
        return ResponseEntity.ok(response);
    }

    /**
     * Elimina una notificación
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteNotification(@PathVariable Long id, @AuthenticationPrincipal User user) {
        notificationService.deleteNotification(id, user);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Notificación eliminada correctamente");
        return ResponseEntity.ok(response);
    }
}
