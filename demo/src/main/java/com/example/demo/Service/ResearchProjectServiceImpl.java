package com.example.demo.Service;

import com.example.demo.DTO.ProjectRequestDTO;
import com.example.demo.DTO.ProjectResponseDTO;
import com.example.demo.DTO.UserResponseDTO;
import com.example.demo.DTO.PatentResponseDTO;
import com.example.demo.Entity.ResearchProject;
import com.example.demo.Entity.User;
import com.example.demo.Repositary.ResearchProjectRepositary;
import com.example.demo.Repositary.UserRepositary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResearchProjectServiceImpl implements ResearchProjectService {

    private final ResearchProjectRepositary projectRepository;
    private final UserRepositary userRepository;

    private ProjectResponseDTO convertToDTO(ResearchProject project) {
        ProjectResponseDTO dto = new ProjectResponseDTO();
        dto.setId(project.getId());
        dto.setTitle(project.getTitle());
        dto.setDescription(project.getDescription());
        dto.setFundingAmount(project.getFundingAmount());
        dto.setDomain(project.getDomain());
        dto.setInstitution(project.getInstitution());
        dto.setStatus(project.getStatus());

        if (project.getResearcher() != null) {
            dto.setUserId(project.getResearcher().getId());
            UserResponseDTO userDTO = new UserResponseDTO();
            userDTO.setId(project.getResearcher().getId());
            userDTO.setName(project.getResearcher().getName());
            userDTO.setEmail(project.getResearcher().getEmail());
            userDTO.setRole(project.getResearcher().getRole().toString());
            dto.setResearcher(userDTO);
        }

        // Convert patents to DTOs without project to avoid circular reference
        List<PatentResponseDTO> patentDTOs = project.getPatents().stream()
                .map(patent -> {
                    PatentResponseDTO patentDTO = new PatentResponseDTO();
                    patentDTO.setId(patent.getId());
                    patentDTO.setTitle(patent.getTitle());
                    patentDTO.setApplicationNumber(patent.getApplicationNumber());
                    patentDTO.setStatus(patent.getStatus());
                    patentDTO.setProjectId(patent.getProject().getId());
                    return patentDTO;
                })
                .collect(Collectors.toList());
        dto.setPatents(patentDTOs);

        return dto;
    }

    @Override
    public ProjectResponseDTO saveProject(ProjectRequestDTO dto) {
        User user = userRepository.findById(dto.getResearcherId())
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + dto.getResearcherId()));

        ResearchProject project = new ResearchProject();
        project.setTitle(dto.getTitle());
        project.setDescription(dto.getDescription());
        project.setFundingAmount(dto.getFundingAmount());
        project.setDomain(dto.getDomain());
        project.setInstitution(dto.getInstitution());
        project.setStatus(dto.getStatus());

        project.setResearcher(user);

        ResearchProject saved = projectRepository.save(project);
        return convertToDTO(saved);
    }

    @Override
    public List<ProjectResponseDTO> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProjectResponseDTO> getProjectsByResearcherId(Long researcherId) {
        return projectRepository.findByResearcherId(researcherId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ProjectResponseDTO getProjectById(Long id) {

        ResearchProject project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with ID: " + id));
        return convertToDTO(project);
    }

    @Override
    public ProjectResponseDTO updateProject(Long id, ProjectRequestDTO dto) {
        ResearchProject project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with ID: " + id));
        User user = userRepository.findById(dto.getResearcherId())
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + dto.getResearcherId()));

        project.setTitle(dto.getTitle());
        project.setDescription(dto.getDescription());
        project.setFundingAmount(dto.getFundingAmount());
        project.setDomain(dto.getDomain());
        project.setInstitution(dto.getInstitution());
        project.setStatus(dto.getStatus());

        project.setResearcher(user);

        ResearchProject saved = projectRepository.save(project);
        return convertToDTO(saved);
    }

    @Override
    public void deleteProject(Long id) {
        if (!projectRepository.existsById(id)) {
            throw new RuntimeException("Project not found with ID: " + id);
        }
        projectRepository.deleteById(id);
    }

    @Override
    public List<PatentResponseDTO> getPatentsByProjectId(Long projectId) {
        ResearchProject project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with ID: " + projectId));
        return project.getPatents().stream()
                .map(patent -> {
                    PatentResponseDTO patentDTO = new PatentResponseDTO();
                    patentDTO.setId(patent.getId());
                    patentDTO.setTitle(patent.getTitle());
                    patentDTO.setApplicationNumber(patent.getApplicationNumber());
                    patentDTO.setStatus(patent.getStatus());
                    patentDTO.setProjectId(patent.getProject().getId());
                    return patentDTO;
                })
                .collect(Collectors.toList());
    }
}
