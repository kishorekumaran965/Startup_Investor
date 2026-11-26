package com.example.demo.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@Slf4j
public class RagPythonClient {

    @Value("${rag.service.url:http://localhost:8001}")
    private String ragServiceUrl;

    @Value("${rag.service.internal-key:vc-internal-secret-key-2024}")
    private String internalKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private HttpHeaders getHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Internal-Key", internalKey);
        return headers;
    }

    public Map<String, Object> ingestDocument(String docId, Long startupId, String documentName, String filePath, String fileType) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("doc_id", docId);
            body.put("startup_id", startupId);
            body.put("document_name", documentName);
            body.put("file_path", filePath);
            body.put("file_type", fileType.toLowerCase().replace(".", ""));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, getHeaders());
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    ragServiceUrl + "/documents/ingest", request, Map.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("RAG ingest failed for doc {}: {}", docId, e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("status", "failed");
            error.put("error", e.getMessage());
            return error;
        }
    }

    public void deleteDocument(String docId) {
        try {
            HttpEntity<Void> request = new HttpEntity<>(getHeaders());
            restTemplate.exchange(
                    ragServiceUrl + "/documents/delete/" + docId,
                    HttpMethod.DELETE, request, Void.class);
        } catch (Exception e) {
            log.error("RAG delete failed for doc {}: {}", docId, e.getMessage());
        }
    }

    public Map<String, Object> query(Long startupId, String question, List<Map<String, String>> history) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("startup_id", startupId);
            body.put("question", question);
            body.put("conversation_history", history);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, getHeaders());
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    ragServiceUrl + "/chat/query", request, Map.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("RAG query failed: {}", e.getMessage());
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("answer", "The AI service is currently unavailable. Please try again later.");
            fallback.put("sources", Collections.emptyList());
            fallback.put("used_context", false);
            fallback.put("retrieved_chunks", 0);
            return fallback;
        }
    }
}
