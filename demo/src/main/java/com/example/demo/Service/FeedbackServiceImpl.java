package com.example.demo.Service;

import com.example.demo.DTO.FeedbackRequestDTO;
import com.example.demo.DTO.FeedbackResponseDTO;
import com.example.demo.Entity.Feedback;
import com.example.demo.Entity.User;
import com.example.demo.Repositary.FeedbackRepositary;
import com.example.demo.Repositary.UserRepositary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackServiceImpl implements FeedbackService {

    private final FeedbackRepositary feedbackRepository;
    private final UserRepositary userRepository;

    private static final int EDIT_WINDOW_DAYS = 7;

    @Override
    public FeedbackResponseDTO leaveFeedback(FeedbackRequestDTO dto) {
        User reviewer = userRepository.findById(dto.getReviewerId())
                .orElseThrow(() -> new RuntimeException("Reviewer not found"));
        User target = userRepository.findById(dto.getTargetId())
                .orElseThrow(() -> new RuntimeException("Target not found"));

        Feedback feedback = new Feedback();
        feedback.setRating(dto.getRating());
        feedback.setComment(dto.getComment());
        feedback.setReviewer(reviewer);
        feedback.setTarget(target);
        feedback.setTargetType(dto.getTargetType());

        Feedback saved = feedbackRepository.save(feedback);
        return convertToDTO(saved);
    }

    @Override
    public FeedbackResponseDTO updateFeedback(Long feedbackId, FeedbackRequestDTO dto) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));

        if (feedback.getCreatedAt().plusDays(EDIT_WINDOW_DAYS).isBefore(LocalDateTime.now())) {
            throw new RuntimeException(
                    "Editing window has closed. Feedback can only be edited within " + EDIT_WINDOW_DAYS + " days.");
        }

        feedback.setRating(dto.getRating());
        feedback.setComment(dto.getComment());
        Feedback saved = feedbackRepository.save(feedback);
        return convertToDTO(saved);
    }

    @Override
    public List<FeedbackResponseDTO> getFeedbackForTarget(Long targetId, String type) {
        return feedbackRepository.findByTargetIdAndTargetType(targetId, type).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteFeedback(Long feedbackId) {
        if (!feedbackRepository.existsById(feedbackId)) {
            throw new RuntimeException("Feedback not found");
        }
        feedbackRepository.deleteById(feedbackId);
    }

    private FeedbackResponseDTO convertToDTO(Feedback feedback) {
        FeedbackResponseDTO dto = new FeedbackResponseDTO();
        dto.setId(feedback.getId());
        dto.setRating(feedback.getRating());
        dto.setComment(feedback.getComment());
        dto.setReviewerId(feedback.getReviewer().getId());
        dto.setReviewerName(feedback.getReviewer().getName());
        dto.setTargetId(feedback.getTarget().getId());
        dto.setTargetName(feedback.getTarget().getName());
        dto.setTargetType(feedback.getTargetType());
        dto.setCreatedAt(feedback.getCreatedAt());
        dto.setUpdatedAt(feedback.getUpdatedAt());

        // Check if editable
        dto.setEditable(feedback.getCreatedAt().plusDays(EDIT_WINDOW_DAYS).isAfter(LocalDateTime.now()));

        return dto;
    }
}
