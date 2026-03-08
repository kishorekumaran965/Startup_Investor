package com.example.demo.Service;

import com.example.demo.DTO.FeedbackRequestDTO;
import com.example.demo.DTO.FeedbackResponseDTO;
import java.util.List;

public interface FeedbackService {
    FeedbackResponseDTO leaveFeedback(FeedbackRequestDTO dto);

    FeedbackResponseDTO updateFeedback(Long feedbackId, FeedbackRequestDTO dto);

    List<FeedbackResponseDTO> getFeedbackForTarget(Long targetId, String type);

    void deleteFeedback(Long feedbackId);
}
