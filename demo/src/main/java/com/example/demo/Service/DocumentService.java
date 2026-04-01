package com.example.demo.Service;

import com.example.demo.DTO.DocumentResponseDTO;
import com.example.demo.DTO.DocumentPermissionRequestDTO;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;
import org.springframework.core.io.Resource;

public interface DocumentService {
    DocumentResponseDTO uploadDocument(Long startupId, String name, String description, String category,
            MultipartFile file)
            throws IOException;

    List<DocumentResponseDTO> getDocumentsByStartup(Long startupId);

    void deleteDocument(Long documentId);

    Resource downloadDocument(Long documentId, Long userId) throws IOException;

    void grantPermission(DocumentPermissionRequestDTO permissionDTO);

    void revokePermission(Long documentId, Long investorId);

    List<DocumentResponseDTO> getSharedDocumentsForInvestor(Long investorId);
}
