package com.example.demo.Repositary;

import com.example.demo.Entity.Document;
import com.example.demo.Entity.DocumentPermission;
import com.example.demo.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DocumentPermissionRepositary extends JpaRepository<DocumentPermission, Long> {
    List<DocumentPermission> findByInvestor(User investor);

    Optional<DocumentPermission> findByDocumentAndInvestor(Document document, User investor);
}
