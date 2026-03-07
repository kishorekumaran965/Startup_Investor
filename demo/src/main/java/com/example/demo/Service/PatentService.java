package com.example.demo.Service;

import com.example.demo.DTO.PatentRequestDTO;
import com.example.demo.DTO.PatentResponseDTO;
import com.example.demo.Entity.Patent;
import java.util.List;

public interface PatentService {
    PatentResponseDTO savePatent(PatentRequestDTO dto);
    List<PatentResponseDTO> getAllPatents();
    PatentResponseDTO getPatentById(Long id);
    PatentResponseDTO updatePatent(Long id, PatentRequestDTO dto);
    void deletePatent(Long id);
}
