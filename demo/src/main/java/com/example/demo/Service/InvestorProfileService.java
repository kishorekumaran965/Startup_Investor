package com.example.demo.Service;

import com.example.demo.DTO.InvestorProfileRequestDTO;
import com.example.demo.DTO.InvestorProfileResponseDTO;

public interface InvestorProfileService {
    InvestorProfileResponseDTO updateProfile(Long userId, InvestorProfileRequestDTO requestDTO);

    InvestorProfileResponseDTO getProfile(Long userId);
}
