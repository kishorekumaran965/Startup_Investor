package com.example.demo.Service;

import com.example.demo.DTO.DocumentResponseDTO;
import com.example.demo.DTO.DocumentPermissionRequestDTO;
import com.example.demo.Entity.Document;
import com.example.demo.Entity.DocumentPermission;
import com.example.demo.Entity.Startup;
import com.example.demo.Entity.User;
import com.example.demo.Repositary.DocumentPermissionRepositary;
import com.example.demo.Repositary.DocumentRepositary;
import com.example.demo.Repositary.StartupRepositary;
import com.example.demo.Repositary.UserRepositary;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepositary documentRepository;
    private final DocumentPermissionRepositary documentPermissionRepository;
    private final StartupRepositary startupRepository;
    private final UserRepositary userRepository;

    private final Path fileStorageLocation = Paths.get("uploads/documents").toAbsolutePath().normalize();

    private void init() {
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    @Override
    public DocumentResponseDTO uploadDocument(Long startupId, String name, String description, String category,
            MultipartFile file)
            throws IOException {
        init();
        Startup startup = startupRepository.findById(startupId)
                .orElseThrow(() -> new RuntimeException("Startup not found with id " + startupId));

        String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        String fileName = System.currentTimeMillis() + "_" + originalFileName;

        Path targetLocation = this.fileStorageLocation.resolve(fileName);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        Document document = new Document();
        document.setName(name);
        document.setFileName(fileName);
        document.setFileType(file.getContentType());
        document.setFilePath(targetLocation.toString());
        document.setDescription(description);
        document.setCategory(category);
        document.setStartup(startup);
        document.setUploadDate(LocalDateTime.now());

        Document savedDocument = documentRepository.save(document);
        return convertToDTO(savedDocument);
    }

    @Override
    public List<DocumentResponseDTO> getDocumentsByStartup(Long startupId) {
        Startup startup = startupRepository.findById(startupId)
                .orElseThrow(() -> new RuntimeException("Startup not found with id " + startupId));
        return documentRepository.findByStartup(startup).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteDocument(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found with id " + documentId));

        try {
            Files.deleteIfExists(Paths.get(document.getFilePath()));
        } catch (IOException e) {
            throw new RuntimeException("Could not delete file", e);
        }

        documentRepository.delete(document);
    }

    @Override
    public Resource downloadDocument(Long documentId, Long userId) throws IOException {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found with id " + documentId));

        // Check if user is owner (founder of startup)
        boolean isOwner = document.getStartup().getFounder().getId().equals(userId);

        // Check if user has permission
        if (!isOwner) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id " + userId));

            DocumentPermission permission = documentPermissionRepository.findByDocumentAndInvestor(document, user)
                    .orElseThrow(() -> new RuntimeException(
                            "Access Denied: You do not have permission to view this document"));

            if (permission.getExpiryDate() != null && permission.getExpiryDate().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Access Denied: Permission has expired");
            }
        }

        try {
            Path filePath = Paths.get(document.getFilePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                return resource;
            } else {
                throw new RuntimeException("File not found " + document.getFileName());
            }
        } catch (MalformedURLException ex) {
            throw new RuntimeException("File not found " + document.getFileName(), ex);
        }
    }

    @Override
    public void grantPermission(DocumentPermissionRequestDTO permissionDTO) {
        Document document = documentRepository.findById(permissionDTO.getDocumentId())
                .orElseThrow(() -> new RuntimeException("Document not found"));
        User investor = userRepository.findById(permissionDTO.getInvestorId())
                .orElseThrow(() -> new RuntimeException("Investor not found"));

        DocumentPermission permission = documentPermissionRepository.findByDocumentAndInvestor(document, investor)
                .orElse(new DocumentPermission());

        permission.setDocument(document);
        permission.setInvestor(investor);
        permission.setExpiryDate(permissionDTO.getExpiryDate());
        permission.setTemporary(permissionDTO.isTemporary());
        permission.setGrantedAt(LocalDateTime.now());

        documentPermissionRepository.save(permission);
    }

    @Override
    public void revokePermission(Long documentId, Long investorId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        User investor = userRepository.findById(investorId)
                .orElseThrow(() -> new RuntimeException("Investor not found"));

        DocumentPermission permission = documentPermissionRepository.findByDocumentAndInvestor(document, investor)
                .orElseThrow(() -> new RuntimeException("Permission not found"));

        documentPermissionRepository.delete(permission);
    }

    @Override
    public List<DocumentResponseDTO> getSharedDocumentsForInvestor(Long investorId) {
        User investor = userRepository.findById(investorId)
                .orElseThrow(() -> new RuntimeException("Investor not found"));

        return documentPermissionRepository.findByInvestor(investor).stream()
                .filter(p -> p.getExpiryDate() == null || p.getExpiryDate().isAfter(LocalDateTime.now()))
                .map(p -> convertToDTO(p.getDocument()))
                .collect(Collectors.toList());
    }

    private DocumentResponseDTO convertToDTO(Document document) {
        DocumentResponseDTO dto = new DocumentResponseDTO();
        dto.setId(document.getId());
        dto.setName(document.getName());
        dto.setFileName(document.getFileName());
        dto.setFileType(document.getFileType());
        dto.setDescription(document.getDescription());
        dto.setCategory(document.getCategory());
        dto.setUploadDate(document.getUploadDate().toString());
        dto.setStartupId(document.getStartup().getId());
        dto.setStartupName(document.getStartup().getName());
        dto.setVetted(document.isVetted());
        return dto;
    }
}
