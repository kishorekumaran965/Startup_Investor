package com.example.demo.DTO;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class ChatResponseDTO {
    private Long conversationId;
    private String conversationTitle;
    private AiMessageDTO userMessage;
    private AiMessageDTO assistantMessage;
}
