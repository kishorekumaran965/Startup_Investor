package com.example.demo.Controller;

import com.example.demo.DTO.FundingApplicationRequestDTO;
import com.example.demo.DTO.FundingApplicationResponseDTO;
import com.example.demo.Service.FundingApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/funding-applications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FundingApplicationController {

    private final FundingApplicationService applicationService;

    @PostMapping
    public FundingApplicationResponseDTO apply(@RequestBody FundingApplicationRequestDTO dto) {
        return applicationService.applyForFunding(dto);
    }

    @GetMapping
    public List<FundingApplicationResponseDTO> getAllApplications() {
        return applicationService.getAllApplications();
    }

    @GetMapping("/investor/{investorId}")
    public List<FundingApplicationResponseDTO> getByInvestor(@PathVariable("investorId") Long investorId) {
        return applicationService.getApplicationsForInvestor(investorId);
    }

    @GetMapping("/startup/{startupId}")
    public List<FundingApplicationResponseDTO> getByStartup(@PathVariable("startupId") Long startupId) {
        return applicationService.getApplicationsForStartup(startupId);
    }

    @PutMapping("/{id}/status")
    public FundingApplicationResponseDTO updateStatus(@PathVariable("id") Long id,
            @RequestParam("status") String status) {
        return applicationService.updateApplicationStatus(id, status);
    }
}
