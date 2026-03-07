package com.example.demo.Service;

import com.example.demo.DTO.MentorshipRequestResponseDTO;
import java.util.List;

public interface MentorshipRequestService {
    MentorshipRequestResponseDTO createRequest(Long startupId, Long mentorId, String message);

    List<MentorshipRequestResponseDTO> getRequestsForMentor(Long userId);

    List<MentorshipRequestResponseDTO> getRequestsForStartup(Long userId);

    MentorshipRequestResponseDTO updateStatus(Long requestId, String status);
}
