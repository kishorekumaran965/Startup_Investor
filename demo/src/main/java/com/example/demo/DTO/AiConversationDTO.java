package com.example.demo.DTO;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class AiConversationDTO {
    private Long id;
    private String title;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long userId;
    private Long startupId;
    private String startupName;
    private List<AiMessageDTO> messages;
}
