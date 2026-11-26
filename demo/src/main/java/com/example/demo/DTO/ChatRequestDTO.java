package com.example.demo.DTO;

import lombok.Data;

@Data
public class ChatRequestDTO {
    private Long startupId;
    private Long conversationId; // null = new conversation
    private String question;
}
