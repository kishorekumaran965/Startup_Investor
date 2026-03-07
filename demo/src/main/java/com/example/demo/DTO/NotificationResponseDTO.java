package com.example.demo.DTO;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponseDTO {
    private Long id;
    private String content;
    private String type;
    private Long relatedId;
    private boolean isRead;
    private LocalDateTime createdAt;
}
