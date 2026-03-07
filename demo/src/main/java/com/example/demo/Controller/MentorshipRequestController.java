package com.example.demo.Controller;

import com.example.demo.DTO.MentorshipRequestResponseDTO;
import com.example.demo.Service.MentorshipRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/mentorship-requests")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MentorshipRequestController {

    private final MentorshipRequestService service;

    @PostMapping("/startup/{startupId}/mentor/{mentorId}")
    public MentorshipRequestResponseDTO createRequest(
            @PathVariable Long startupId,
            @PathVariable Long mentorId,
            @RequestParam(required = false) String message) {
        return service.createRequest(startupId, mentorId, message);
    }

    @GetMapping("/mentor/{userId}")
    public List<MentorshipRequestResponseDTO> getRequestsForMentor(@PathVariable Long userId) {
        return service.getRequestsForMentor(userId);
    }

    @GetMapping("/startup/{userId}")
    public List<MentorshipRequestResponseDTO> getRequestsForStartup(@PathVariable Long userId) {
        return service.getRequestsForStartup(userId);
    }

    @PutMapping("/{requestId}/status")
    public MentorshipRequestResponseDTO updateStatus(
            @PathVariable Long requestId,
            @RequestParam String status) {
        return service.updateStatus(requestId, status);
    }
}
