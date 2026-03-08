package com.example.demo.DTO;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class FeedbackResponseDTO {
    private Long id;
    private Integer rating;
    private String comment;
    private Long reviewerId;
    private String reviewerName;
    private Long targetId;
    private String targetName;
    private String targetType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isEditable;
}
