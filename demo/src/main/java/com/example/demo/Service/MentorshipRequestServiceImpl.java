package com.example.demo.Service;

import com.example.demo.DTO.MentorshipRequestResponseDTO;
import com.example.demo.Entity.Mentor;
import com.example.demo.Entity.MentorshipRequest;
import com.example.demo.Entity.Startup;
import com.example.demo.Repositary.MentorRepositary;
import com.example.demo.Repositary.MentorshipRequestRepositary;
import com.example.demo.Repositary.StartupRepositary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MentorshipRequestServiceImpl implements MentorshipRequestService {

    private final MentorshipRequestRepositary requestRepository;
    private final StartupRepositary startupRepository;
    private final MentorRepositary mentorRepository;
    private final NotificationService notificationService;
    private final StartupService startupService;

    @Override
    public MentorshipRequestResponseDTO createRequest(Long startupId, Long mentorId, String message) {
        // Check for existing pending or approved requests
        List<MentorshipRequest> existing = requestRepository.findByStartupIdAndMentorId(startupId, mentorId);
        boolean alreadyExists = existing.stream()
                .anyMatch(r -> "PENDING".equalsIgnoreCase(r.getStatus()) || "APPROVED".equalsIgnoreCase(r.getStatus()));

        if (alreadyExists) {
            throw new RuntimeException(
                    "A mentorship request for this startup and mentor already exists or is approved.");
        }

        Startup startup = startupRepository.findById(startupId)
                .orElseThrow(() -> new RuntimeException("Startup not found with id: " + startupId));
        Mentor mentor = mentorRepository.findById(mentorId)
                .orElseThrow(() -> new RuntimeException("Mentor not found with id: " + mentorId));

        MentorshipRequest req = new MentorshipRequest();
        req.setStartup(startup);
        req.setMentor(mentor);
        req.setMessage(message);
        req.setStatus("PENDING");

        MentorshipRequest saved = requestRepository.save(req);

        // Notify mentor
        if (mentor.getUser() != null) {
            notificationService.createNotification(
                    mentor.getUser(),
                    "Startup " + startup.getName() + " requested mentorship from you!",
                    "MENTORSHIP_REQUESTED");
        }

        return mapToDTO(saved);
    }

    @Override
    public List<MentorshipRequestResponseDTO> getRequestsForMentor(Long userId) {
        Mentor mentor = mentorRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Mentor profile not found"));
        return requestRepository.findByMentorIdAndStatus(mentor.getId(), "PENDING").stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<MentorshipRequestResponseDTO> getRequestsForStartup(Long userId) {
        return requestRepository.findByStartupFounderId(userId).stream() // Assume founder is user
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public MentorshipRequestResponseDTO updateStatus(Long requestId, String status) {
        MentorshipRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        req.setStatus(status.toUpperCase());
        MentorshipRequest saved = requestRepository.save(req);

        if ("APPROVED".equalsIgnoreCase(status)) {
            // Assign mentor to startup using existing service logic
            startupService.assignMentor(req.getStartup().getId(), req.getMentor().getId());
        }

        // Notify startup founder
        if (req.getStartup().getFounder() != null) {
            String mentorName = (req.getMentor().getUser() != null) ? req.getMentor().getUser().getName() : "Mentor";
            notificationService.createNotification(
                    req.getStartup().getFounder(),
                    "Mentor " + mentorName + " " + status.toLowerCase() + " your mentorship request for "
                            + req.getStartup().getName(),
                    "MENTORSHIP_STATUS_UPDATE");
        }

        return mapToDTO(saved);
    }

    private MentorshipRequestResponseDTO mapToDTO(MentorshipRequest req) {
        MentorshipRequestResponseDTO dto = new MentorshipRequestResponseDTO();
        dto.setId(req.getId());
        dto.setStartupId(req.getStartup().getId());
        dto.setStartupName(req.getStartup().getName());
        dto.setMentorId(req.getMentor().getId());
        dto.setMentorName(req.getMentor().getUser() != null ? req.getMentor().getUser().getName() : "Expert");
        dto.setStatus(req.getStatus());
        dto.setMessage(req.getMessage());
        dto.setCreatedAt(req.getCreatedAt());
        return dto;
    }
}
