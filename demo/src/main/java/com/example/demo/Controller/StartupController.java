package com.example.demo.Controller;

import com.example.demo.DTO.StartupRequestDTO;
import com.example.demo.DTO.StartupResponseDTO;
import com.example.demo.DTO.FundingResponseDTO;
import com.example.demo.Service.StartupService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/startups")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StartupController {

    private final StartupService startupService;

    @PostMapping
    public StartupResponseDTO createStartup(@RequestBody StartupRequestDTO dto) {
        return startupService.saveStartup(dto);
    }

    @GetMapping
    public List<StartupResponseDTO> getAllStartups() {
        return startupService.getAllStartups();
    }

    @GetMapping("/{id}")
    public StartupResponseDTO getStartupById(@PathVariable("id") Long id) {
        return startupService.getStartupById(id);
    }

    @PutMapping("/{id}")
    public StartupResponseDTO updateStartup(@PathVariable("id") Long id, @RequestBody StartupRequestDTO dto) {
        return startupService.updateStartup(id, dto);
    }

    @DeleteMapping("/{id}")
    public void deleteStartup(@PathVariable("id") Long id) {
        startupService.deleteStartup(id);
    }

    @GetMapping("/{id}/fundings")
    public List<FundingResponseDTO> getStartupFundings(@PathVariable("id") Long id) {
        return startupService.getFundingsByStartupId(id);
    }

    @PutMapping("/{id}/mentor/{mentorId}")
    public StartupResponseDTO assignMentor(@PathVariable("id") Long id, @PathVariable("mentorId") Long mentorId) {
        System.out.println("DEBUG: Controller hitting assignMentor for Startup: " + id + ", Mentor: " + mentorId);
        return startupService.assignMentor(id, mentorId);
    }
}
