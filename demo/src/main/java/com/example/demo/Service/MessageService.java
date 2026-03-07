package com.example.demo.Service;

import com.example.demo.DTO.MessageRequestDTO;
import com.example.demo.DTO.MessageResponseDTO;

import java.util.List;

public interface MessageService {
    MessageResponseDTO sendMessage(MessageRequestDTO request, String senderEmail);

    List<MessageResponseDTO> getConversation(Long otherUserId, String currentUserEmail);

    void markAsRead(Long messageId);

    List<com.example.demo.DTO.UserResponseDTO> getRecentConversations(String email);
}
