package com.example.demo.Service;

import com.example.demo.DTO.FundingRequestDTO;
import com.example.demo.DTO.FundingResponseDTO;
import com.example.demo.DTO.StartupResponseDTO;
import com.example.demo.DTO.UserResponseDTO;
import com.example.demo.Entity.Funding;
import com.example.demo.Entity.FundingType;
import com.example.demo.Entity.Startup;
import com.example.demo.Repositary.FundingRepositary;
import com.example.demo.Repositary.StartupRepositary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FundingServiceImpl implements FundingService {

    private final FundingRepositary fundingRepository;
    private final StartupRepositary startupRepository;

    private FundingResponseDTO convertToDTO(Funding funding) {
        FundingResponseDTO dto = new FundingResponseDTO();
        dto.setId(funding.getId());
        dto.setAmount(funding.getAmount());
        dto.setFundingSource(funding.getFundingSource());
        dto.setFundingType(funding.getFundingType() != null ? funding.getFundingType().toString() : null);
        dto.setStatus(funding.getStatus());
        dto.setFundingDate(funding.getFundingDate());
        
        if (funding.getStartup() != null) {
            dto.setStartupId(funding.getStartup().getId());
            StartupResponseDTO startupDTO = new StartupResponseDTO();
            startupDTO.setId(funding.getStartup().getId());
            startupDTO.setName(funding.getStartup().getName());
            startupDTO.setSector(funding.getStartup().getSector());
            startupDTO.setStage(funding.getStartup().getStage());
            
            if (funding.getStartup().getFounder() != null) {
                startupDTO.setUserId(funding.getStartup().getFounder().getId());
                UserResponseDTO userDTO = new UserResponseDTO();
                userDTO.setId(funding.getStartup().getFounder().getId());
                userDTO.setName(funding.getStartup().getFounder().getName());
                userDTO.setEmail(funding.getStartup().getFounder().getEmail());
                userDTO.setRole(funding.getStartup().getFounder().getRole().toString());
                startupDTO.setFounder(userDTO);
            }
            dto.setStartup(startupDTO);
        }
        return dto;
    }

    @Override
    public FundingResponseDTO saveFunding(FundingRequestDTO dto) {
        Startup startup = startupRepository.findById(dto.getStartupId())
                .orElseThrow(() -> new RuntimeException("Startup not found with ID: " + dto.getStartupId()));

        Funding funding = new Funding();
        funding.setAmount(dto.getAmount());
        funding.setFundingSource(dto.getFundingSource());
        funding.setFundingType(dto.getFundingType() != null ? FundingType.valueOf(dto.getFundingType()) : null);
        funding.setStatus(dto.getStatus());
        funding.setFundingDate(dto.getFundingDate());
        funding.setStartup(startup);

        Funding saved = fundingRepository.save(funding);
        return convertToDTO(saved);
    }

    @Override
    public List<FundingResponseDTO> getAllFundings() {
        return fundingRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public FundingResponseDTO getFundingById(Long id) {
        Funding funding = fundingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Funding not found with ID: " + id));
        return convertToDTO(funding);
    }

    @Override
    public FundingResponseDTO updateFunding(Long id, FundingRequestDTO dto) {
        Funding funding = fundingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Funding not found with ID: " + id));
        Startup startup = startupRepository.findById(dto.getStartupId())
                .orElseThrow(() -> new RuntimeException("Startup not found with ID: " + dto.getStartupId()));

        funding.setAmount(dto.getAmount());
        funding.setFundingSource(dto.getFundingSource());
        funding.setFundingType(dto.getFundingType() != null ? FundingType.valueOf(dto.getFundingType()) : null);
        funding.setStatus(dto.getStatus());
        funding.setFundingDate(dto.getFundingDate());
        funding.setStartup(startup);

        Funding saved = fundingRepository.save(funding);
        return convertToDTO(saved);
    }

    @Override
    public void deleteFunding(Long id) {
        if (!fundingRepository.existsById(id)) {
            throw new RuntimeException("Funding not found with ID: " + id);
        }
        fundingRepository.deleteById(id);
    }
}
