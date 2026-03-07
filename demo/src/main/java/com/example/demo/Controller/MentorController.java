package com.example.demo.Controller;

import com.example.demo.DTO.MentorRequestDTO;
import com.example.demo.DTO.MentorResponseDTO;
import com.example.demo.Entity.Mentor;
import com.example.demo.Service.MentorService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mentors")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MentorController {

    private final MentorService mentorService;

    @PostMapping
    public MentorResponseDTO createMentor(@RequestBody MentorRequestDTO mentor) {
        return mentorService.saveMentor(mentor);
    }

    @GetMapping
    public List<MentorResponseDTO> getAllMentors() {
        return mentorService.getAllMentors();
    }

    @GetMapping("/{id}")
    public MentorResponseDTO getMentorById(@PathVariable("id") Long id) {
        return mentorService.getMentorById(id);
    }

    @GetMapping("/user/{userId}")
    public MentorResponseDTO getMentorByUserId(@PathVariable("userId") Long userId) {
        return mentorService.getMentorByUserId(userId);
    }

    @PutMapping("/{id}")
    public MentorResponseDTO updateMentor(@PathVariable("id") Long id, @RequestBody Mentor mentor) {
        return mentorService.updateMentor(id, mentor);
    }

    @DeleteMapping("/{id}")
    public void deleteMentor(@PathVariable("id") Long id) {
        mentorService.deleteMentor(id);
    }

    @PutMapping("/{id}/approve")
    public MentorResponseDTO approveMentor(@PathVariable("id") Long id, @RequestParam("status") String status) {
        return mentorService.approveMentor(id, status);
    }

    @GetMapping("/pending")
    public List<MentorResponseDTO> getPendingMentors() {
        return mentorService.getPendingMentors();
    }
}
