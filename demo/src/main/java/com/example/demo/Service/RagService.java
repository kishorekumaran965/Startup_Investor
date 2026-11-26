package com.example.demo.Service;

import com.example.demo.DTO.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

public interface RagService {
    AiDocumentDTO uploadAndIngestDocument(Long startupId, String name, MultipartFile file, String authenticatedUserEmail) throws IOException;
    List<AiDocumentDTO> getDocumentsByStartup(Long startupId, String authenticatedUserEmail);
    void deleteDocument(String docId, String authenticatedUserEmail);
    ChatResponseDTO chat(ChatRequestDTO request, String authenticatedUserEmail);
    List<AiConversationDTO> getConversations(String authenticatedUserEmail, Long startupId);
    AiConversationDTO getConversation(Long conversationId, String authenticatedUserEmail);
    void deleteConversation(Long conversationId, String authenticatedUserEmail);
}
