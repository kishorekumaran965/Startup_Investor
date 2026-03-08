package com.example.demo.Repositary;

import com.example.demo.Entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FeedbackRepositary extends JpaRepository<Feedback, Long> {
    List<Feedback> findByTargetId(Long targetId);

    List<Feedback> findByReviewerId(Long reviewerId);

    List<Feedback> findByTargetIdAndTargetType(Long targetId, String targetType);
}
