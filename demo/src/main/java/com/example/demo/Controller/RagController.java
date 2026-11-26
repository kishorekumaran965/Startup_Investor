package com.example.demo.Controller;

import com.example.demo.DTO.*;
import com.example.demo.Service.RagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RagController {

    private final RagService ragService;

    // ==================== DOCUMENT ENDPOINTS ====================

    @PostMapping("/documents/upload")
    public ResponseEntity<AiDocumentDTO> uploadDocument(
            @RequestParam("startupId") Long startupId,
            @RequestParam("name") String name,
            @RequestParam("file") MultipartFile file,
            Authentication auth) throws IOException {
        return ResponseEntity.ok(ragService.uploadAndIngestDocument(startupId, name, file, auth.getName()));
    }

    @GetMapping("/documents/startup/{startupId}")
    public ResponseEntity<List<AiDocumentDTO>> getDocuments(
            @PathVariable Long startupId,
            Authentication auth) {
        return ResponseEntity.ok(ragService.getDocumentsByStartup(startupId, auth.getName()));
    }

    @DeleteMapping("/documents/{docId}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable String docId,
            Authentication auth) {
        ragService.deleteDocument(docId, auth.getName());
        return ResponseEntity.noContent().build();
    }

    // ==================== CHAT ENDPOINTS ====================

    @PostMapping("/chat")
    public ResponseEntity<ChatResponseDTO> chat(
            @RequestBody ChatRequestDTO request,
            Authentication auth) {
        return ResponseEntity.ok(ragService.chat(request, auth.getName()));
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<AiConversationDTO>> getConversations(
            @RequestParam(required = false) Long startupId,
            Authentication auth) {
        return ResponseEntity.ok(ragService.getConversations(auth.getName(), startupId));
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<AiConversationDTO> getConversation(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(ragService.getConversation(id, auth.getName()));
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<Void> deleteConversation(
            @PathVariable Long id,
            Authentication auth) {
        ragService.deleteConversation(id, auth.getName());
        return ResponseEntity.noContent().build();
    }
}
