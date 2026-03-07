package com.example.demo.Controller;

import com.example.demo.DTO.InvestorProfileRequestDTO;
import com.example.demo.DTO.InvestorProfileResponseDTO;
import com.example.demo.Service.InvestorProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/investor-profiles")
public class InvestorProfileController {

    @Autowired
    private InvestorProfileService investorProfileService;

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
}
