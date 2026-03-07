package com.example.demo.Repositary;

import com.example.demo.Entity.ResearchProject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResearchProjectRepositary extends JpaRepository<ResearchProject, Long> {
    List<ResearchProject> findByResearcherId(Long researcherId);
}
