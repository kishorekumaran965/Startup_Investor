package com.example.demo.DTO;

import com.example.demo.Entity.MessageRole;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
public class AiMessageDTO {
    private Long id;
    private MessageRole role;
    private String content;
    private List<Map<String, Object>> sources;
    private Boolean usedContext;
    private Integer retrievedChunks;
    private LocalDateTime createdAt;
}
