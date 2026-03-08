package com.example.demo.Repositary;

import com.example.demo.Entity.Document;
import com.example.demo.Entity.Startup;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DocumentRepositary extends JpaRepository<Document, Long> {
    List<Document> findByStartup(Startup startup);
}
