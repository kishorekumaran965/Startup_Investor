package com.example.demo.Controller;

import com.example.demo.DTO.FeedbackRequestDTO;
import com.example.demo.DTO.FeedbackResponseDTO;
import com.example.demo.Service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping
    public ResponseEntity<FeedbackResponseDTO> leaveFeedback(@RequestBody FeedbackRequestDTO dto) {
        return ResponseEntity.ok(feedbackService.leaveFeedback(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FeedbackResponseDTO> updateFeedback(@PathVariable Long id,
            @RequestBody FeedbackRequestDTO dto) {
        return ResponseEntity.ok(feedbackService.updateFeedback(id, dto));
    }

    @GetMapping("/target/{targetId}")
    public ResponseEntity<List<FeedbackResponseDTO>> getFeedback(@PathVariable Long targetId,
            @RequestParam String type) {
        return ResponseEntity.ok(feedbackService.getFeedbackForTarget(targetId, type));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFeedback(@PathVariable Long id) {
        feedbackService.deleteFeedback(id);
        return ResponseEntity.noContent().build();
    }
}
