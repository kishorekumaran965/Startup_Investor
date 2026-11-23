package com.example.demo.Service;

import com.example.demo.DTO.InvestorProfileRequestDTO;
import com.example.demo.DTO.InvestorProfileResponseDTO;
import com.example.demo.Entity.InvestorProfile;
import com.example.demo.Entity.User;
import com.example.demo.Repositary.InvestorProfileRepositary;
import com.example.demo.Repositary.UserRepositary;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class InvestorProfileServiceImpl implements InvestorProfileService {

    @Autowired
    private InvestorProfileRepositary investorProfileRepositary;

    @Autowired
    private UserRepositary userRepository;

    @Override
    public InvestorProfileResponseDTO updateProfile(Long userId, InvestorProfileRequestDTO dto) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        InvestorProfile profile = user.getInvestorProfile();
        if (profile == null) {
            profile = new InvestorProfile();
            profile.setUser(user);
        }

        profile.setFirmName(dto.getFirmName());
        profile.setInvestmentFocus(dto.getInvestmentFocus());
        profile.setMinInvestmentSize(dto.getMinInvestmentSize());
        profile.setMaxInvestmentSize(dto.getMaxInvestmentSize());
        profile.setBio(dto.getBio());

        // Matching preference fields
        if (dto.getInvestorType() != null) profile.setInvestorType(dto.getInvestorType());
        if (dto.getLocation() != null) profile.setLocation(dto.getLocation());
        if (dto.getTotalInvestmentBudget() != null) profile.setTotalInvestmentBudget(dto.getTotalInvestmentBudget());
        if (dto.getAvailableCapital() != null) profile.setAvailableCapital(dto.getAvailableCapital());
        if (dto.getPreferredStages() != null) profile.setPreferredStages(dto.getPreferredStages());
        if (dto.getPreferredBusinessModels() != null) profile.setPreferredBusinessModels(dto.getPreferredBusinessModels());
        if (dto.getPreferredLocations() != null) profile.setPreferredLocations(dto.getPreferredLocations());
        if (dto.getRiskTolerance() != null) profile.setRiskTolerance(dto.getRiskTolerance());
        if (dto.getInvestmentStrategy() != null) profile.setInvestmentStrategy(dto.getInvestmentStrategy());
        if (dto.getPreferredEquityMin() != null) profile.setPreferredEquityMin(dto.getPreferredEquityMin());
        if (dto.getPreferredEquityMax() != null) profile.setPreferredEquityMax(dto.getPreferredEquityMax());
        if (dto.getInvestmentHorizon() != null) profile.setInvestmentHorizon(dto.getInvestmentHorizon());
        if (dto.getPreviousInvestmentCount() != null) profile.setPreviousInvestmentCount(dto.getPreviousInvestmentCount());
        if (dto.getSuccessfulInvestments() != null) profile.setSuccessfulInvestments(dto.getSuccessfulInvestments());
        if (dto.getInvestmentExperience() != null) profile.setInvestmentExperience(dto.getInvestmentExperience());
        if (dto.getExpectedReturnPercentage() != null) profile.setExpectedReturnPercentage(dto.getExpectedReturnPercentage());

        InvestorProfile saved = investorProfileRepositary.save(profile);
        return convertToDTO(saved);
    }

    @Override
    public InvestorProfileResponseDTO getProfile(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        InvestorProfile profile = user.getInvestorProfile();
        if (profile == null) {
            throw new RuntimeException("Investor profile not found");
        }
        return convertToDTO(profile);
    }

    private InvestorProfileResponseDTO convertToDTO(InvestorProfile p) {
        InvestorProfileResponseDTO dto = new InvestorProfileResponseDTO();
        dto.setId(p.getId());
        dto.setUserId(p.getUser().getId());
        dto.setUserName(p.getUser().getName());
        dto.setUserEmail(p.getUser().getEmail());
        dto.setFirmName(p.getFirmName());
        dto.setInvestmentFocus(p.getInvestmentFocus());
        dto.setMinInvestmentSize(p.getMinInvestmentSize());
        dto.setMaxInvestmentSize(p.getMaxInvestmentSize());
        dto.setBio(p.getBio());
        dto.setInvestorType(p.getInvestorType());
        dto.setLocation(p.getLocation());
        dto.setTotalInvestmentBudget(p.getTotalInvestmentBudget());
        dto.setAvailableCapital(p.getAvailableCapital());
        dto.setPreferredStages(p.getPreferredStages());
        dto.setPreferredBusinessModels(p.getPreferredBusinessModels());
        dto.setPreferredLocations(p.getPreferredLocations());
        dto.setRiskTolerance(p.getRiskTolerance());
        dto.setInvestmentStrategy(p.getInvestmentStrategy());
        dto.setPreferredEquityMin(p.getPreferredEquityMin());
        dto.setPreferredEquityMax(p.getPreferredEquityMax());
        dto.setInvestmentHorizon(p.getInvestmentHorizon());
        dto.setPreviousInvestmentCount(p.getPreviousInvestmentCount());
        dto.setSuccessfulInvestments(p.getSuccessfulInvestments());
        dto.setInvestmentExperience(p.getInvestmentExperience());
        dto.setExpectedReturnPercentage(p.getExpectedReturnPercentage());
        return dto;
    }
}
