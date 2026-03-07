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
    public InvestorProfileResponseDTO updateProfile(Long userId, InvestorProfileRequestDTO requestDTO) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        InvestorProfile profile = user.getInvestorProfile();
        if (profile == null) {
            profile = new InvestorProfile();
            profile.setUser(user);
        }

        profile.setFirmName(requestDTO.getFirmName());
        profile.setInvestmentFocus(requestDTO.getInvestmentFocus());
        profile.setMinInvestmentSize(requestDTO.getMinInvestmentSize());
        profile.setMaxInvestmentSize(requestDTO.getMaxInvestmentSize());
        profile.setBio(requestDTO.getBio());

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

    private InvestorProfileResponseDTO convertToDTO(InvestorProfile profile) {
        return new InvestorProfileResponseDTO(
                profile.getId(),
                profile.getUser().getId(),
                profile.getUser().getName(),
                profile.getUser().getEmail(),
                profile.getFirmName(),
                profile.getInvestmentFocus(),
                profile.getMinInvestmentSize(),
                profile.getMaxInvestmentSize(),
                profile.getBio());
    }
}
