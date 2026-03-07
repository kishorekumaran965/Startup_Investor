package com.example.demo.Service;

import com.example.demo.Entity.Mentor;
import com.example.demo.DTO.MentorRequestDTO;
import com.example.demo.DTO.MentorResponseDTO;
import java.util.List;

public interface MentorService {
    MentorResponseDTO saveMentor(MentorRequestDTO mentor);

    List<MentorResponseDTO> getAllMentors();

    MentorResponseDTO getMentorById(Long id);

    MentorResponseDTO getMentorByUserId(Long userId);

    MentorResponseDTO updateMentor(Long id, Mentor mentor);

    void deleteMentor(Long id);

    MentorResponseDTO approveMentor(Long id, String status);

    List<MentorResponseDTO> getPendingMentors();
}
