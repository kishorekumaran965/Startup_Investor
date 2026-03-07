package com.example.demo.Service;

import com.example.demo.DTO.ProjectRequestDTO;
import com.example.demo.DTO.ProjectResponseDTO;
import com.example.demo.DTO.PatentResponseDTO;
import com.example.demo.Entity.ResearchProject;
import java.util.List;

public interface ResearchProjectService {
    ProjectResponseDTO saveProject(ProjectRequestDTO dto);

    List<ProjectResponseDTO> getAllProjects();

    List<ProjectResponseDTO> getProjectsByResearcherId(Long researcherId);

    ProjectResponseDTO getProjectById(Long id);

    ProjectResponseDTO updateProject(Long id, ProjectRequestDTO dto);

    void deleteProject(Long id);

    List<PatentResponseDTO> getPatentsByProjectId(Long projectId);
}
