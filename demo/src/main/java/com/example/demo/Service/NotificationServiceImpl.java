package com.example.demo.Service;

import com.example.demo.DTO.NotificationResponseDTO;
import com.example.demo.Entity.Notification;
import com.example.demo.Entity.Role;
import com.example.demo.Entity.User;
import com.example.demo.Repositary.NotificationRepositary;
import com.example.demo.Repositary.UserRepositary;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationServiceImpl implements NotificationService {

    @Autowired
    private NotificationRepositary notificationRepositary;

    @Autowired
    private UserRepositary userRepositary;

    @Override
    public void createNotification(User recipient, String content, String type) {
        createNotification(recipient, content, type, null);
    }

    @Override
    public void createNotification(User recipient, String content, String type, Long relatedId) {
        if (recipient == null) {
            System.err.println("ERROR: Attempted to create notification for NULL recipient. skipping.");
            return;
        }
        System.out
                .println("DEBUG: Creating notification for user: " + recipient.getId());
        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setContent(content);
        notification.setType(type);
        notification.setRelatedId(relatedId);
        notificationRepositary.save(notification);
        System.out.println("DEBUG: Notification saved locally.");
    }

    @Override
    public List<NotificationResponseDTO> getNotificationsForUser(Long userId) {
        return notificationRepositary.findByRecipientIdOrderByCreatedAtDesc(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationResponseDTO> getUnreadNotificationsForUser(Long userId) {
        return notificationRepositary.findByRecipientIdAndReadStatusFalse(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void markAsRead(Long notificationId) {
        notificationRepositary.findById(notificationId).ifPresent(n -> {
            n.setReadStatus(true);
            notificationRepositary.save(n);
        });
    }

    @Override
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepositary.findByRecipientIdAndReadStatusFalse(userId);
        unread.forEach(n -> n.setReadStatus(true));
        notificationRepositary.saveAll(unread);
    }

    @Override
    public void broadcastNotification(String content, String type) {
        List<User> allUsers = userRepositary.findAll();
        List<Notification> batch = allUsers.stream().map(user -> {
            Notification n = new Notification();
            n.setRecipient(user);
            n.setContent(content);
            n.setType(type);
            return n;
        }).collect(Collectors.toList());
        notificationRepositary.saveAll(batch);
        System.out.println("DEBUG: Broadcasted notification to " + allUsers.size() + " users.");
    }

    @Override
    public void broadcastToRole(String content, String type, Role role) {
        List<User> usersWithRole = userRepositary.findByRole(role);

        List<Notification> batch = usersWithRole.stream().map(user -> {
            Notification n = new Notification();
            n.setRecipient(user);
            n.setContent(content);
            n.setType(type);
            return n;
        }).collect(Collectors.toList());
        notificationRepositary.saveAll(batch);
        System.out.println("DEBUG: Broadcasted notification to " + usersWithRole.size() + " users with role: " + role);
    }

    private NotificationResponseDTO convertToDTO(Notification notification) {
        return new NotificationResponseDTO(
                notification.getId(),
                notification.getContent(),
                notification.getType(),
                notification.getRelatedId(),
                notification.isReadStatus(),
                notification.getCreatedAt());
    }
}
