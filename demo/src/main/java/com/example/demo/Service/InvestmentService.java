package com.example.demo.Service;

import com.example.demo.DTO.InvestmentRequestDTO;
import com.example.demo.DTO.InvestmentResponseDTO;
import java.util.List;

public interface InvestmentService {
    InvestmentResponseDTO saveInvestment(InvestmentRequestDTO dto);
    List<InvestmentResponseDTO> getAllInvestments();
    InvestmentResponseDTO getInvestmentById(Long id);
    InvestmentResponseDTO updateInvestment(Long id, InvestmentRequestDTO dto);
    void deleteInvestment(Long id);
}
