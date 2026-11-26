package com.example.demo.Service;

import com.example.demo.DTO.*;
import com.example.demo.Entity.*;
import com.example.demo.Repositary.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RagServiceImpl implements RagService {

    private final AiDocumentRepositary aiDocumentRepositary;
    private final AiConversationRepositary aiConversationRepositary;
    private final AiMessageRepositary aiMessageRepositary;
    private final UserRepositary userRepositary;
    private final StartupRepositary startupRepositary;
    private final RagPythonClient ragPythonClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Set<String> ALLOWED_TYPES = Set.of("pdf", "docx", "pptx", "txt");
    private static final long MAX_FILE_SIZE = 50L * 1024 * 1024; // 50MB
    private static final String UPLOAD_DIR = "uploads/ai_documents/";

    // ==================== DOCUMENT OPERATIONS ====================

    @Override
    public AiDocumentDTO uploadAndIngestDocument(Long startupId, String name, MultipartFile file, String authenticatedUserEmail) throws IOException {
        // 1. Validate file
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds the maximum allowed limit of 50MB");
        }

        String originalFileName = file.getOriginalFilename();
        String fileType = getFileExtension(originalFileName);
        if (!ALLOWED_TYPES.contains(fileType.toLowerCase())) {
            throw new IllegalArgumentException("Unsupported file type: " + fileType + ". Allowed types: pdf, docx, pptx, txt");
        }

        // 2. Authorize: load user and startup
        User user = userRepositary.findByEmail(authenticatedUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + authenticatedUserEmail));
        Startup startup = startupRepositary.findById(startupId)
                .orElseThrow(() -> new RuntimeException("Startup not found: " + startupId));
        if (!startup.getFounder().getId().equals(user.getId())) {
            throw new SecurityException("You are not authorized to upload documents for this startup");
        }

        // 3. Save file to disk
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        String docId = UUID.randomUUID().toString();
        String storedFileName = docId + "." + fileType;
        Path filePath = uploadPath.resolve(storedFileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // 4. Create entity with status=UPLOADED
        AiDocument aiDocument = new AiDocument();
        aiDocument.setId(docId);
        aiDocument.setName(name);
        aiDocument.setOriginalFileName(originalFileName);
        aiDocument.setFileType(fileType.toLowerCase());
        aiDocument.setFilePath(filePath.toAbsolutePath().toString());
        aiDocument.setStatus(ProcessingStatus.UPLOADED);
        aiDocument.setUploadedAt(LocalDateTime.now());
        aiDocument.setStartup(startup);
        aiDocument.setUploadedBy(user);

        // 5. Save to DB
        aiDocumentRepositary.save(aiDocument);

        // 6. Update status to PROCESSING and call Python RAG service
        aiDocument.setStatus(ProcessingStatus.PROCESSING);
        aiDocumentRepositary.save(aiDocument);

        try {
            Map<String, Object> result = ragPythonClient.ingestDocument(
                    docId, startupId, name, filePath.toAbsolutePath().toString(), fileType);

            String status = result != null ? String.valueOf(result.getOrDefault("status", "failed")) : "failed";
            if ("completed".equalsIgnoreCase(status) || "success".equalsIgnoreCase(status)) {
                aiDocument.setStatus(ProcessingStatus.COMPLETED);
                Object chunks = result.get("chunks_created");
                if (chunks instanceof Number) {
                    aiDocument.setChunksCreated(((Number) chunks).intValue());
                }
            } else {
                aiDocument.setStatus(ProcessingStatus.FAILED);
                aiDocument.setErrorMessage(String.valueOf(result.getOrDefault("error", "Unknown error from RAG service")));
            }
        } catch (Exception e) {
            log.error("RAG ingestion error for document {}: {}", docId, e.getMessage());
            aiDocument.setStatus(ProcessingStatus.FAILED);
            aiDocument.setErrorMessage(e.getMessage());
        }

        aiDocument.setProcessedAt(LocalDateTime.now());
        aiDocumentRepositary.save(aiDocument);

        // 8. Return DTO
        return toAiDocumentDTO(aiDocument);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AiDocumentDTO> getDocumentsByStartup(Long startupId, String authenticatedUserEmail) {
        User user = userRepositary.findByEmail(authenticatedUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + authenticatedUserEmail));
        Startup startup = startupRepositary.findById(startupId)
                .orElseThrow(() -> new RuntimeException("Startup not found: " + startupId));
        if (!startup.getFounder().getId().equals(user.getId())) {
            throw new SecurityException("You are not authorized to view documents for this startup");
        }
        return aiDocumentRepositary.findByStartup(startup).stream()
                .map(this::toAiDocumentDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteDocument(String docId, String authenticatedUserEmail) {
        User user = userRepositary.findByEmail(authenticatedUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + authenticatedUserEmail));
        AiDocument aiDocument = aiDocumentRepositary.findById(docId)
                .orElseThrow(() -> new RuntimeException("Document not found: " + docId));

        Startup startup = aiDocument.getStartup();
        if (!startup.getFounder().getId().equals(user.getId())) {
            throw new SecurityException("You are not authorized to delete this document");
        }

        // 1. Call Python RAG service to delete vectors
        ragPythonClient.deleteDocument(docId);

        // 2. Delete file from disk
        try {
            Path filePath = Paths.get(aiDocument.getFilePath());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.warn("Could not delete file from disk for doc {}: {}", docId, e.getMessage());
        }

        // 3. Delete from DB
        aiDocumentRepositary.delete(aiDocument);
    }

    // ==================== CHAT OPERATIONS ====================

    @Override
    public ChatResponseDTO chat(ChatRequestDTO request, String authenticatedUserEmail) {
        // 1. Authorize user
        User user = userRepositary.findByEmail(authenticatedUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + authenticatedUserEmail));
        Startup startup = startupRepositary.findById(request.getStartupId())
                .orElseThrow(() -> new RuntimeException("Startup not found: " + request.getStartupId()));
        if (!startup.getFounder().getId().equals(user.getId())) {
            throw new SecurityException("You are not authorized to chat about this startup");
        }

        // 2. Load or create conversation
        AiConversation conversation;
        if (request.getConversationId() != null) {
            conversation = aiConversationRepositary.findById(request.getConversationId())
                    .orElseThrow(() -> new RuntimeException("Conversation not found: " + request.getConversationId()));
            // Verify this conversation belongs to the user
            if (!conversation.getUser().getId().equals(user.getId())) {
                throw new SecurityException("You are not authorized to access this conversation");
            }
        } else {
            conversation = new AiConversation();
            conversation.setUser(user);
            conversation.setStartup(startup);
            conversation.setCreatedAt(LocalDateTime.now());
            conversation.setUpdatedAt(LocalDateTime.now());
            // Auto-generate title from first question (truncate to 50 chars)
            String title = request.getQuestion();
            if (title != null && title.length() > 50) {
                title = title.substring(0, 47) + "...";
            }
            conversation.setTitle(title);
            conversation = aiConversationRepositary.save(conversation);
        }

        // 3. Get last 6 messages as conversation history (most recent first, then reverse)
        List<AiMessage> recentMessages = aiMessageRepositary.findTop6ByConversationOrderByCreatedAtDesc(conversation);
        Collections.reverse(recentMessages); // oldest first
        List<Map<String, String>> history = recentMessages.stream()
                .map(msg -> {
                    Map<String, String> entry = new HashMap<>();
                    entry.put("role", msg.getRole().name().toLowerCase());
                    entry.put("content", msg.getContent());
                    return entry;
                })
                .collect(Collectors.toList());

        // 4. Call Python RAG service
        Map<String, Object> ragResult = ragPythonClient.query(request.getStartupId(), request.getQuestion(), history);

        // 5. Parse response
        String answer = String.valueOf(ragResult.getOrDefault("answer", "No response from AI service."));
        boolean usedContext = Boolean.parseBoolean(String.valueOf(ragResult.getOrDefault("used_context", false)));
        int retrievedChunks = 0;
        Object chunksObj = ragResult.get("retrieved_chunks");
        if (chunksObj instanceof Number) {
            retrievedChunks = ((Number) chunksObj).intValue();
        }
        List<Map<String, Object>> sources = new ArrayList<>();
        Object sourcesObj = ragResult.get("sources");
        if (sourcesObj instanceof List) {
            for (Object src : (List<?>) sourcesObj) {
                if (src instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> srcMap = (Map<String, Object>) src;
                    sources.add(srcMap);
                }
            }
        }
        String sourcesJson = "[]";
        try {
            sourcesJson = objectMapper.writeValueAsString(sources);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize sources to JSON: {}", e.getMessage());
        }

        // 6. Save user message
        AiMessage userMessage = new AiMessage();
        userMessage.setRole(MessageRole.USER);
        userMessage.setContent(request.getQuestion());
        userMessage.setConversation(conversation);
        userMessage.setUsedContext(false);
        userMessage.setRetrievedChunks(0);
        userMessage.setSourcesJson("[]");
        userMessage.setCreatedAt(LocalDateTime.now());
        userMessage = aiMessageRepositary.save(userMessage);

        // 7. Save assistant message
        AiMessage assistantMessage = new AiMessage();
        assistantMessage.setRole(MessageRole.ASSISTANT);
        assistantMessage.setContent(answer);
        assistantMessage.setConversation(conversation);
        assistantMessage.setUsedContext(usedContext);
        assistantMessage.setRetrievedChunks(retrievedChunks);
        assistantMessage.setSourcesJson(sourcesJson);
        assistantMessage.setCreatedAt(LocalDateTime.now());
        assistantMessage = aiMessageRepositary.save(assistantMessage);

        // 8. Update conversation timestamp
        conversation.setUpdatedAt(LocalDateTime.now());
        aiConversationRepositary.save(conversation);

        // 9. Build response
        ChatResponseDTO response = new ChatResponseDTO();
        response.setConversationId(conversation.getId());
        response.setConversationTitle(conversation.getTitle());
        response.setUserMessage(toAiMessageDTO(userMessage));
        response.setAssistantMessage(toAiMessageDTO(assistantMessage));
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AiConversationDTO> getConversations(String authenticatedUserEmail, Long startupId) {
        User user = userRepositary.findByEmail(authenticatedUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + authenticatedUserEmail));
        List<AiConversation> conversations;
        if (startupId != null) {
            conversations = aiConversationRepositary.findByUserAndStartupIdOrderByUpdatedAtDesc(user, startupId);
        } else {
            conversations = aiConversationRepositary.findByUserOrderByUpdatedAtDesc(user);
        }
        return conversations.stream()
                .map(c -> toAiConversationDTO(c, false))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AiConversationDTO getConversation(Long conversationId, String authenticatedUserEmail) {
        User user = userRepositary.findByEmail(authenticatedUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + authenticatedUserEmail));
        AiConversation conversation = aiConversationRepositary.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found: " + conversationId));
        if (!conversation.getUser().getId().equals(user.getId())) {
            throw new SecurityException("You are not authorized to access this conversation");
        }
        return toAiConversationDTO(conversation, true);
    }

    @Override
    public void deleteConversation(Long conversationId, String authenticatedUserEmail) {
        User user = userRepositary.findByEmail(authenticatedUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + authenticatedUserEmail));
        AiConversation conversation = aiConversationRepositary.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found: " + conversationId));
        if (!conversation.getUser().getId().equals(user.getId())) {
            throw new SecurityException("You are not authorized to delete this conversation");
        }
        aiConversationRepositary.delete(conversation);
    }

    // ==================== MAPPING HELPERS ====================

    private AiDocumentDTO toAiDocumentDTO(AiDocument doc) {
        AiDocumentDTO dto = new AiDocumentDTO();
        dto.setId(doc.getId());
        dto.setName(doc.getName());
        dto.setOriginalFileName(doc.getOriginalFileName());
        dto.setFileType(doc.getFileType());
        dto.setStatus(doc.getStatus());
        dto.setErrorMessage(doc.getErrorMessage());
        dto.setChunksCreated(doc.getChunksCreated());
        dto.setUploadedAt(doc.getUploadedAt());
        dto.setProcessedAt(doc.getProcessedAt());
        if (doc.getStartup() != null) {
            dto.setStartupId(doc.getStartup().getId());
            dto.setStartupName(doc.getStartup().getName());
        }
        if (doc.getUploadedBy() != null) {
            dto.setUploadedById(doc.getUploadedBy().getId());
        }
        return dto;
    }

    private AiConversationDTO toAiConversationDTO(AiConversation conversation, boolean includeMessages) {
        AiConversationDTO dto = new AiConversationDTO();
        dto.setId(conversation.getId());
        dto.setTitle(conversation.getTitle());
        dto.setCreatedAt(conversation.getCreatedAt());
        dto.setUpdatedAt(conversation.getUpdatedAt());
        if (conversation.getUser() != null) {
            dto.setUserId(conversation.getUser().getId());
        }
        if (conversation.getStartup() != null) {
            dto.setStartupId(conversation.getStartup().getId());
            dto.setStartupName(conversation.getStartup().getName());
        }
        if (includeMessages) {
            List<AiMessage> messages = aiMessageRepositary.findByConversationOrderByCreatedAtAsc(conversation);
            dto.setMessages(messages.stream().map(this::toAiMessageDTO).collect(Collectors.toList()));
        } else {
            dto.setMessages(new ArrayList<>());
        }
        return dto;
    }

    private AiMessageDTO toAiMessageDTO(AiMessage message) {
        AiMessageDTO dto = new AiMessageDTO();
        dto.setId(message.getId());
        dto.setRole(message.getRole());
        dto.setContent(message.getContent());
        dto.setUsedContext(message.getUsedContext());
        dto.setRetrievedChunks(message.getRetrievedChunks());
        dto.setCreatedAt(message.getCreatedAt());
        // Deserialize sources JSON
        if (message.getSourcesJson() != null && !message.getSourcesJson().isBlank()) {
            try {
                List<Map<String, Object>> sources = objectMapper.readValue(
                        message.getSourcesJson(),
                        new TypeReference<List<Map<String, Object>>>() {});
                dto.setSources(sources);
            } catch (JsonProcessingException e) {
                log.warn("Failed to deserialize sources JSON for message {}: {}", message.getId(), e.getMessage());
                dto.setSources(new ArrayList<>());
            }
        } else {
            dto.setSources(new ArrayList<>());
        }
        return dto;
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1);
    }
}
