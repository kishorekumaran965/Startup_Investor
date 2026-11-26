package com.example.demo.Repositary;

import com.example.demo.Entity.AiConversation;
import com.example.demo.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AiConversationRepositary extends JpaRepository<AiConversation, Long> {
    List<AiConversation> findByUserOrderByUpdatedAtDesc(User user);
    List<AiConversation> findByUserAndStartupIdOrderByUpdatedAtDesc(User user, Long startupId);
}
