package com.example.demo.Service;

import com.example.demo.DTO.NotificationResponseDTO;
import com.example.demo.Entity.User;
import com.example.demo.Entity.Role;
import java.util.List;

public interface NotificationService {
    void createNotification(User recipient, String content, String type);

    void createNotification(User recipient, String content, String type, Long relatedId);

    List<NotificationResponseDTO> getNotificationsForUser(Long userId);

    List<NotificationResponseDTO> getUnreadNotificationsForUser(Long userId);

    void markAsRead(Long notificationId);

    void markAllAsRead(Long userId);

    void broadcastNotification(String content, String type);

    void broadcastToRole(String content, String type, Role role);
}
