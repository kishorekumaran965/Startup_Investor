package com.example.demo.Controller;

import com.example.demo.DTO.DocumentResponseDTO;
import com.example.demo.DTO.DocumentPermissionRequestDTO;
import com.example.demo.Service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping("/upload")
    public ResponseEntity<DocumentResponseDTO> uploadDocument(
            @RequestParam("startupId") Long startupId,
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @RequestParam("file") MultipartFile file) throws IOException {

        DocumentResponseDTO responseDTO = documentService.uploadDocument(startupId, name, description, file);
        return ResponseEntity.ok(responseDTO);
    }

    @GetMapping("/startup/{startupId}")
    public ResponseEntity<List<DocumentResponseDTO>> getDocumentsByStartup(@PathVariable Long startupId) {
        return ResponseEntity.ok(documentService.getDocumentsByStartup(startupId));
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long documentId) {
        documentService.deleteDocument(documentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/download/{documentId}")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long documentId, @RequestParam("userId") Long userId)
            throws IOException {
        Resource resource = documentService.downloadDocument(documentId, userId);

        String contentType = "application/octet-stream";
        String headerValue = "attachment; filename=\"" + resource.getFilename() + "\"";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, headerValue)
                .body(resource);
    }

    @PostMapping("/permissions/grant")
    public ResponseEntity<Void> grantPermission(@RequestBody DocumentPermissionRequestDTO permissionDTO) {
        documentService.grantPermission(permissionDTO);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/permissions/revoke")
    public ResponseEntity<Void> revokePermission(@RequestParam Long documentId, @RequestParam Long investorId) {
        documentService.revokePermission(documentId, investorId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/shared/{investorId}")
    public ResponseEntity<List<DocumentResponseDTO>> getSharedDocumentsForInvestor(@PathVariable Long investorId) {
        return ResponseEntity.ok(documentService.getSharedDocumentsForInvestor(investorId));
    }
}
