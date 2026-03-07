package com.example.demo.Service;

import com.example.demo.DTO.StartupRequestDTO;
import com.example.demo.DTO.StartupResponseDTO;
import com.example.demo.DTO.FundingResponseDTO;
import com.example.demo.Entity.Startup;
import java.util.List;

public interface StartupService {
    StartupResponseDTO saveStartup(StartupRequestDTO dto);

    List<StartupResponseDTO> getAllStartups();

    StartupResponseDTO getStartupById(Long id);

    StartupResponseDTO updateStartup(Long id, StartupRequestDTO dto);

    void deleteStartup(Long id);

    List<FundingResponseDTO> getFundingsByStartupId(Long startupId);

    StartupResponseDTO assignMentor(Long startupId, Long mentorId);
}
