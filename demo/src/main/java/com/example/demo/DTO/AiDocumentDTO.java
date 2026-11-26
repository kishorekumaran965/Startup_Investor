package com.example.demo.DTO;

import com.example.demo.Entity.ProcessingStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AiDocumentDTO {
    private String id;
    private String name;
    private String originalFileName;
    private String fileType;
    private ProcessingStatus status;
    private String errorMessage;
    private Integer chunksCreated;
    private LocalDateTime uploadedAt;
    private LocalDateTime processedAt;
    private Long startupId;
    private String startupName;
    private Long uploadedById;
}
