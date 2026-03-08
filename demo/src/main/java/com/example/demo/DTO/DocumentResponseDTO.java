package com.example.demo.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DocumentResponseDTO {
    private Long id;
    private String name;
    private String fileName;
    private String fileType;
    private String description;
    private String uploadDate;
    private Long startupId;
    private String startupName;
    private boolean isVetted;
}
