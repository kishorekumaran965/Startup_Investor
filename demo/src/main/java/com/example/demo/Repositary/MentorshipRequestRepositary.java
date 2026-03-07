package com.example.demo.Repositary;

import com.example.demo.Entity.MentorshipRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MentorshipRequestRepositary extends JpaRepository<MentorshipRequest, Long> {
    List<MentorshipRequest> findByMentorIdAndStatus(Long mentorId, String status);

    List<MentorshipRequest> findByStartupFounderId(Long founderId);

    List<MentorshipRequest> findByStartupIdAndMentorId(Long startupId, Long mentorId);
}
