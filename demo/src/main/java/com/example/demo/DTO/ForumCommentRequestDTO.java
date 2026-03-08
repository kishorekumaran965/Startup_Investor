package com.example.demo.DTO;

import lombok.Data;

@Data
public class ForumCommentRequestDTO {
    private String content;
    private Long authorId;
    private Long postId;
}
