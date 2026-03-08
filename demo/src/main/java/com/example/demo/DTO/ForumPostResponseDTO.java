package com.example.demo.DTO;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ForumPostResponseDTO {
    private Long id;
    private String title;
    private String content;
    private Long authorId;
    private String authorName;
    private String authorRole;
    private String category;
    private LocalDateTime createdAt;
    private int commentCount;
}
