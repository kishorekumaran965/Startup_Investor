package com.example.demo.DTO;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MentorshipRequestResponseDTO {
    private Long id;
    private Long startupId;
    private String startupName;
    private Long mentorId;
    private String mentorName;
    private String status;
    private String message;
    private LocalDateTime createdAt;
}
