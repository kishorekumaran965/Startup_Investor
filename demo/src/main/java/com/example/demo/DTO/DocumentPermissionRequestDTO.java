package com.example.demo.DTO;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class DocumentPermissionRequestDTO {
    private Long documentId;
    private Long investorId;
    private LocalDateTime expiryDate;
    private boolean isTemporary = true;
}
