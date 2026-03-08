package com.example.demo.DTO;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ForumCommentResponseDTO {
    private Long id;
    private String content;
    private Long authorId;
    private String authorName;
    private LocalDateTime createdAt;
}
