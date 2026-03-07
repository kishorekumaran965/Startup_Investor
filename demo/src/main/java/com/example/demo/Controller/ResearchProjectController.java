package com.example.demo.Controller;

import com.example.demo.DTO.ProjectRequestDTO;
import com.example.demo.DTO.ProjectResponseDTO;
import com.example.demo.DTO.PatentResponseDTO;
import com.example.demo.Service.ResearchProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ResearchProjectController {

    private final ResearchProjectService projectService;

    @PostMapping
    public ProjectResponseDTO createProject(@RequestBody ProjectRequestDTO dto) {
        return projectService.saveProject(dto);
    }

    @GetMapping
    public List<ProjectResponseDTO> getAllProjects() {
        return projectService.getAllProjects();
    }

    @GetMapping("/researcher/{researcherId}")
    public List<ProjectResponseDTO> getResearcherProjects(@PathVariable("researcherId") Long researcherId) {
        return projectService.getProjectsByResearcherId(researcherId);
    }

    @GetMapping("/{id}")
    public ProjectResponseDTO getProjectById(@PathVariable("id") Long id) {
        return projectService.getProjectById(id);
    }

    @PutMapping("/{id}")
    public ProjectResponseDTO updateProject(@PathVariable("id") Long id, @RequestBody ProjectRequestDTO dto) {
        return projectService.updateProject(id, dto);
    }

    @DeleteMapping("/{id}")
    public void deleteProject(@PathVariable("id") Long id) {
        projectService.deleteProject(id);
    }

    @GetMapping("/{id}/patents")
    public List<PatentResponseDTO> getProjectPatents(@PathVariable("id") Long id) {
        return projectService.getPatentsByProjectId(id);
    }
}
