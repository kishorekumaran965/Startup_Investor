package com.example.demo.Repositary;

import com.example.demo.Entity.AiDocument;
import com.example.demo.Entity.ProcessingStatus;
import com.example.demo.Entity.Startup;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AiDocumentRepositary extends JpaRepository<AiDocument, String> {
    List<AiDocument> findByStartup(Startup startup);
    List<AiDocument> findByStartupAndStatus(Startup startup, ProcessingStatus status);
    boolean existsByFilePathAndStatus(String filePath, ProcessingStatus status);
}
