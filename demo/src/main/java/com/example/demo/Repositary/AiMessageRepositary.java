package com.example.demo.Repositary;

import com.example.demo.Entity.AiMessage;
import com.example.demo.Entity.AiConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AiMessageRepositary extends JpaRepository<AiMessage, Long> {
    List<AiMessage> findByConversationOrderByCreatedAtAsc(AiConversation conversation);
    List<AiMessage> findTop6ByConversationOrderByCreatedAtDesc(AiConversation conversation);
}
