package com.example.demo.Service;

import com.example.demo.DTO.InvestmentRequestDTO;
import com.example.demo.DTO.InvestmentResponseDTO;
import com.example.demo.DTO.StartupResponseDTO;
import com.example.demo.DTO.UserResponseDTO;
import com.example.demo.Entity.Investment;
import com.example.demo.Entity.Startup;
import com.example.demo.Entity.User;
import com.example.demo.Repositary.InvestmentRepositary;
import com.example.demo.Repositary.StartupRepositary;
import com.example.demo.Repositary.UserRepositary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvestmentServiceImpl implements InvestmentService {

    private final InvestmentRepositary investmentRepository;
    private final StartupRepositary startupRepository;
    private final UserRepositary userRepository;

    private InvestmentResponseDTO convertToDTO(Investment inv) {
        InvestmentResponseDTO dto = new InvestmentResponseDTO();
        dto.setId(inv.getId());
        dto.setAmount(inv.getAmount());
        dto.setInvestmentDate(inv.getInvestmentDate());

        if (inv.getInvestor() != null) {
            dto.setInvestorId(inv.getInvestor().getId());
            UserResponseDTO userDTO = new UserResponseDTO();
            userDTO.setId(inv.getInvestor().getId());
            userDTO.setName(inv.getInvestor().getName());
            userDTO.setEmail(inv.getInvestor().getEmail());
            if (inv.getInvestor().getRole() != null) {
                userDTO.setRole(inv.getInvestor().getRole().toString());
            }
            dto.setInvestor(userDTO);
        }

        if (inv.getStartup() != null) {
            dto.setStartupId(inv.getStartup().getId());
            StartupResponseDTO startupDTO = new StartupResponseDTO();
            startupDTO.setId(inv.getStartup().getId());
            startupDTO.setName(inv.getStartup().getName());
            startupDTO.setSector(inv.getStartup().getSector());
            startupDTO.setStage(inv.getStartup().getStage());

            if (inv.getStartup().getFounder() != null) {
                UserResponseDTO founderDTO = new UserResponseDTO();
                founderDTO.setId(inv.getStartup().getFounder().getId());
                founderDTO.setName(inv.getStartup().getFounder().getName());
                founderDTO.setEmail(inv.getStartup().getFounder().getEmail());
                if (inv.getStartup().getFounder().getRole() != null) {
                    founderDTO.setRole(inv.getStartup().getFounder().getRole().toString());
                }
                startupDTO.setFounder(founderDTO);
            }
            dto.setStartup(startupDTO);
        }
        return dto;
    }

    @Override
    public InvestmentResponseDTO saveInvestment(InvestmentRequestDTO dto) {
        Startup startup = startupRepository.findById(dto.getStartupId())
                .orElseThrow(() -> new RuntimeException("Startup not found with ID: " + dto.getStartupId()));

        User investor = userRepository.findById(dto.getInvestorId())
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + dto.getInvestorId()));

        Investment inv = new Investment();
        inv.setAmount(dto.getAmount());
        inv.setInvestmentDate(dto.getInvestmentDate());
        inv.setStartup(startup);
        inv.setInvestor(investor);

        Investment saved = investmentRepository.save(inv);
        return convertToDTO(saved);
    }

    @Override
    public List<InvestmentResponseDTO> getAllInvestments() {
        return investmentRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public InvestmentResponseDTO getInvestmentById(Long id) {
        Investment inv = investmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Investment not found with ID: " + id));
        return convertToDTO(inv);
    }

    @Override
    public InvestmentResponseDTO updateInvestment(Long id, InvestmentRequestDTO dto) {
        Investment inv = investmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Investment not found with ID: " + id));

        Startup startup = startupRepository.findById(dto.getStartupId())
                .orElseThrow(() -> new RuntimeException("Startup not found with ID: " + dto.getStartupId()));

        User investor = userRepository.findById(dto.getInvestorId())
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + dto.getInvestorId()));

        inv.setAmount(dto.getAmount());
        inv.setInvestmentDate(dto.getInvestmentDate());
        inv.setStartup(startup);
        inv.setInvestor(investor);

        Investment saved = investmentRepository.save(inv);
        return convertToDTO(saved);
    }

    @Override
    public void deleteInvestment(Long id) {
        if (!investmentRepository.existsById(id)) {
            throw new RuntimeException("Investment not found with ID: " + id);
        }
        investmentRepository.deleteById(id);
    }
}
