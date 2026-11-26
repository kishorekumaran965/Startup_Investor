package com.example.demo.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_documents")
@Getter
@Setter
@NoArgsConstructor
public class AiDocument {

    @Id
    private String id; // UUID, matches ChromaDB doc_id

    private String name;
    private String originalFileName;
    private String fileType; // pdf, docx, pptx, txt
    private String filePath;

    @Enumerated(EnumType.STRING)
    private ProcessingStatus status; // UPLOADED, PROCESSING, COMPLETED, FAILED

    private String errorMessage;
    private Integer chunksCreated;
    private LocalDateTime uploadedAt;
    private LocalDateTime processedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "startup_id")
    private Startup startup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;
}
