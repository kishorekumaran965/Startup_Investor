package com.example.demo.DTO;

import lombok.Data;

@Data
public class ForumPostRequestDTO {
    private String title;
    private String content;
    private Long authorId;
    private String category;
}
