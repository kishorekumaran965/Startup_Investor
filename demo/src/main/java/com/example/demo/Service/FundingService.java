package com.example.demo.Service;

import com.example.demo.DTO.FundingRequestDTO;
import com.example.demo.DTO.FundingResponseDTO;
import com.example.demo.Entity.Funding;
import java.util.List;

public interface FundingService {
    FundingResponseDTO saveFunding(FundingRequestDTO dto);
    List<FundingResponseDTO> getAllFundings();
    FundingResponseDTO getFundingById(Long id);
    FundingResponseDTO updateFunding(Long id, FundingRequestDTO dto);
    void deleteFunding(Long id);
}
