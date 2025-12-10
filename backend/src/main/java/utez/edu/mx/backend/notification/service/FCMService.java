package utez.edu.mx.backend.notification.service;

import com.google.firebase.messaging.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FCMService {

    private static final Logger logger = LoggerFactory.getLogger(FCMService.class);

    /**
     * Envía una notificación push a un único dispositivo
     */
    public void sendNotification(String fcmToken, String title, String body, Map<String, String> data) {
        if (fcmToken == null || fcmToken.isEmpty()) {
            logger.warn("[FCM] No se puede enviar notificación: FCM token es nulo o vacío");
            return;
        }

        try {
            logger.info("[FCM] Enviando notificación push...");
            logger.info("[FCM] Token: {}", fcmToken.substring(0, Math.min(20, fcmToken.length())) + "...");
            logger.info("[FCM] Title: {}", title);
            logger.info("[FCM] Body: {}", body);

            Message message = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .putAllData(data != null ? data : new HashMap<>())
                    .setAndroidConfig(AndroidConfig.builder()
                            .setPriority(AndroidConfig.Priority.HIGH)
                            .setNotification(AndroidNotification.builder()
                                    .setSound("default")
                                    .setClickAction("FLUTTER_NOTIFICATION_CLICK")
                                    .build())
                            .build())
                    .setWebpushConfig(WebpushConfig.builder()
                            .setNotification(WebpushNotification.builder()
                                    .setIcon("/vite.svg")
                                    .setBadge("/vite.svg")
                                    .build())
                            .build())
                    .build();

            String response = FirebaseMessaging.getInstance().send(message);
            logger.info("[FCM] ✓ Notificación enviada exitosamente: {}", response);

        } catch (FirebaseMessagingException e) {
            logger.error("Error al enviar notificación push", e);
            if (e.getMessagingErrorCode() == MessagingErrorCode.INVALID_ARGUMENT ||
                    e.getMessagingErrorCode() == MessagingErrorCode.UNREGISTERED) {
                logger.warn("Token FCM inválido o no registrado: {}", fcmToken);
            }
        }
    }

    /**
     * Envía una notificación a múltiples dispositivos
     */
    public void sendNotificationToMultiple(List<String> fcmTokens, String title, String body, Map<String, String> data) {
        if (fcmTokens == null || fcmTokens.isEmpty()) {
            logger.warn("[FCM] No se puede enviar notificación: lista de tokens vacía");
            return;
        }

        // Filtrar tokens nulos o vacíos
        List<String> validTokens = fcmTokens.stream()
                .filter(token -> token != null && !token.isEmpty())
                .toList();

        if (validTokens.isEmpty()) {
            logger.warn("[FCM] No hay tokens válidos para enviar notificación");
            return;
        }

        try {
            logger.info("[FCM] Enviando notificaciones push a {} destinatarios...", validTokens.size());
            logger.info("[FCM] Title: {}", title);
            logger.info("[FCM] Body: {}", body);

            MulticastMessage message = MulticastMessage.builder()
                    .addAllTokens(validTokens)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .putAllData(data != null ? data : new HashMap<>())
                    .setAndroidConfig(AndroidConfig.builder()
                            .setPriority(AndroidConfig.Priority.HIGH)
                            .setNotification(AndroidNotification.builder()
                                    .setSound("default")
                                    .setClickAction("FLUTTER_NOTIFICATION_CLICK")
                                    .build())
                            .build())
                    .setWebpushConfig(WebpushConfig.builder()
                            .setNotification(WebpushNotification.builder()
                                    .setIcon("/vite.svg")
                                    .setBadge("/vite.svg")
                                    .build())
                            .build())
                    .build();

            BatchResponse response = FirebaseMessaging.getInstance().sendEachForMulticast(message);
            logger.info("[FCM] ✓ Notificaciones enviadas. Exitosas: {}, Fallidas: {}",
                    response.getSuccessCount(), response.getFailureCount());

            if (response.getFailureCount() > 0) {
                List<SendResponse> responses = response.getResponses();
                for (int i = 0; i < responses.size(); i++) {
                    if (!responses.get(i).isSuccessful()) {
                        logger.error("Error al enviar a token {}: {}",
                                validTokens.get(i), responses.get(i).getException().getMessage());
                    }
                }
            }

        } catch (FirebaseMessagingException e) {
            logger.error("Error al enviar notificaciones múltiples", e);
        }
    }
}
