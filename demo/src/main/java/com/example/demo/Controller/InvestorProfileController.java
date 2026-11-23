package com.example.demo.Controller;

import com.example.demo.DTO.InvestorProfileRequestDTO;
import com.example.demo.DTO.InvestorProfileResponseDTO;
import com.example.demo.Service.InvestorProfileService;
import com.example.demo.Service.InvestorStartupMatchingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/investor-profiles")
public class InvestorProfileController {

    @Autowired
    private InvestorProfileService investorProfileService;

    @Autowired
    private InvestorStartupMatchingService matchingService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<InvestorProfileResponseDTO> getProfile(@PathVariable("userId") Long userId) {
        return ResponseEntity.ok(investorProfileService.getProfile(userId));
    }

    @PutMapping("/user/{userId}")
    public ResponseEntity<InvestorProfileResponseDTO> updateProfile(
            @PathVariable("userId") Long userId,
            @RequestBody InvestorProfileRequestDTO requestDTO) {
        return ResponseEntity.ok(investorProfileService.updateProfile(userId, requestDTO));
    }

    @GetMapping("/user/{userId}/matching-startups")
    public ResponseEntity<List<Map<String, Object>>> getMatchingStartups(@PathVariable("userId") Long userId) {
        return ResponseEntity.ok(matchingService.findMatchingStartups(userId));
    }
}
