package com.example.demo.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FeedbackRequestDTO {
    private Integer rating;
    private String comment;
    private Long reviewerId;
    private Long targetId;
    private String targetType;
}
