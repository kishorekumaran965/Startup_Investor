package com.example.demo.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Document {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String fileName;

    private String fileType;

    private String filePath;

    private String description;

    private LocalDateTime uploadDate = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "startup_id")
    private Startup startup;

    private boolean isVetted = false;
}
