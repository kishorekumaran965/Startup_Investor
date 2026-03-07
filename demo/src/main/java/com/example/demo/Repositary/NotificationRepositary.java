package com.example.demo.Repositary;

import com.example.demo.Entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepositary extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long userId);

    List<Notification> findByRecipientIdAndReadStatusFalse(Long userId);
}
