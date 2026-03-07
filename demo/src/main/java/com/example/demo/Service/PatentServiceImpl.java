package com.example.demo.Service;

import com.example.demo.DTO.PatentRequestDTO;
import com.example.demo.DTO.PatentResponseDTO;
import com.example.demo.DTO.ProjectResponseDTO;
import com.example.demo.DTO.UserResponseDTO;
import com.example.demo.Entity.Patent;
import com.example.demo.Entity.ResearchProject;
import com.example.demo.Repositary.PatentRepositary;
import com.example.demo.Repositary.ResearchProjectRepositary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatentServiceImpl implements PatentService {

    private final PatentRepositary patentRepository;
    private final ResearchProjectRepositary projectRepository;

    private PatentResponseDTO convertToDTO(Patent patent) {
        PatentResponseDTO dto = new PatentResponseDTO();
        dto.setId(patent.getId());
        dto.setTitle(patent.getTitle());
        dto.setApplicationNumber(patent.getApplicationNumber());
        dto.setStatus(patent.getStatus());
        
        if (patent.getProject() != null) {
            dto.setProjectId(patent.getProject().getId());
            ProjectResponseDTO projectDTO = new ProjectResponseDTO();
            projectDTO.setId(patent.getProject().getId());
            projectDTO.setTitle(patent.getProject().getTitle());
            projectDTO.setDescription(patent.getProject().getDescription());
            projectDTO.setFundingAmount(patent.getProject().getFundingAmount());
            projectDTO.setStatus(patent.getProject().getStatus());
            
            if (patent.getProject().getResearcher() != null) {
                projectDTO.setUserId(patent.getProject().getResearcher().getId());
                UserResponseDTO userDTO = new UserResponseDTO();
                userDTO.setId(patent.getProject().getResearcher().getId());
                userDTO.setName(patent.getProject().getResearcher().getName());
                userDTO.setEmail(patent.getProject().getResearcher().getEmail());
                userDTO.setRole(patent.getProject().getResearcher().getRole().toString());
                projectDTO.setResearcher(userDTO);
            }
            dto.setProject(projectDTO);
        }
        return dto;
    }

    @Override
    public PatentResponseDTO savePatent(PatentRequestDTO dto) {
        ResearchProject project = projectRepository.findById(dto.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found with ID: " + dto.getProjectId()));

        Patent patent = new Patent();
        patent.setTitle(dto.getTitle());
        patent.setApplicationNumber(dto.getApplicationNumber());
        patent.setStatus(dto.getStatus());
        patent.setProject(project);

        Patent saved = patentRepository.save(patent);
        return convertToDTO(saved);
    }

    @Override
    public List<PatentResponseDTO> getAllPatents() {
        return patentRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public PatentResponseDTO getPatentById(Long id) {
        Patent patent = patentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patent not found with ID: " + id));
        return convertToDTO(patent);
    }

    @Override
    public PatentResponseDTO updatePatent(Long id, PatentRequestDTO dto) {
        Patent patent = patentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patent not found with ID: " + id));
        ResearchProject project = projectRepository.findById(dto.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found with ID: " + dto.getProjectId()));

        patent.setTitle(dto.getTitle());
        patent.setApplicationNumber(dto.getApplicationNumber());
        patent.setStatus(dto.getStatus());
        patent.setProject(project);

        Patent saved = patentRepository.save(patent);
        return convertToDTO(saved);
    }

    @Override
    public void deletePatent(Long id) {
        if (!patentRepository.existsById(id)) {
            throw new RuntimeException("Patent not found with ID: " + id);
        }
        patentRepository.deleteById(id);
    }
}
