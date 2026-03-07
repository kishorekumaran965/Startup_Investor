package com.example.demo.Controller;

import com.example.demo.DTO.NotificationResponseDTO;
import com.example.demo.Service.NotificationService;
import com.example.demo.Entity.Role;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NotificationResponseDTO>> getNotifications(@PathVariable("userId") Long userId) {
        return ResponseEntity.ok(notificationService.getNotificationsForUser(userId));
    }

    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<List<NotificationResponseDTO>> getUnreadNotifications(@PathVariable("userId") Long userId) {
        return ResponseEntity.ok(notificationService.getUnreadNotificationsForUser(userId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable("id") Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<Void> markAllAsRead(@PathVariable("userId") Long userId) {
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/broadcast")
    public ResponseEntity<String> broadcast(@RequestParam String message) {
        notificationService.broadcastNotification(message, "ANNOUNCEMENT");
        return ResponseEntity.ok("Announcement broadcasted successfully");
    }

    @PostMapping("/broadcast-by-role")
    public ResponseEntity<String> broadcastByRole(@RequestParam String message, @RequestParam Role role) {
        notificationService.broadcastToRole(message, "ANNOUNCEMENT", role);
        return ResponseEntity.ok("Announcement broadcasted to " + role + " successfully");
    }
}
