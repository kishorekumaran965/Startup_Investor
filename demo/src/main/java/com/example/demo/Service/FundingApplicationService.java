package com.example.demo.Service;

import com.example.demo.DTO.FundingApplicationRequestDTO;
import com.example.demo.DTO.FundingApplicationResponseDTO;
import java.util.List;

public interface FundingApplicationService {
    FundingApplicationResponseDTO applyForFunding(FundingApplicationRequestDTO dto);

    List<FundingApplicationResponseDTO> getApplicationsForInvestor(Long investorId);

    List<FundingApplicationResponseDTO> getApplicationsForStartup(Long startupId);

    List<FundingApplicationResponseDTO> getAllApplications();

    FundingApplicationResponseDTO updateApplicationStatus(Long id, String status);
}
