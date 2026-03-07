package com.example.demo.Repositary;

import com.example.demo.Entity.Mentor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface MentorRepositary extends JpaRepository<Mentor, Long> {
    Optional<Mentor> findByUserId(Long userId);

    List<Mentor> findByStatus(String status);
}
