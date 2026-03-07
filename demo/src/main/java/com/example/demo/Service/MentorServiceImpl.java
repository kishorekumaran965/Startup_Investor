package com.example.demo.Service;

import com.example.demo.DTO.MentorRequestDTO;
import com.example.demo.DTO.MentorResponseDTO;
import com.example.demo.DTO.StartupResponseDTO;
import com.example.demo.Entity.Mentor;
import com.example.demo.Entity.User;
import com.example.demo.Repositary.MentorRepositary;
import com.example.demo.Repositary.UserRepositary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MentorServiceImpl implements MentorService {

    private final MentorRepositary mentorRepository;
    private final UserRepositary userRepository;

    @Override
    public MentorResponseDTO saveMentor(MentorRequestDTO dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + dto.getUserId()));

        Mentor mentor = new Mentor();
        mentor.setExpertise(dto.getExpertise());
        mentor.setBio(dto.getBio());
        mentor.setContactNumber(dto.getContactNumber());
        mentor.setYearsOfExperience(dto.getYearsOfExperience());
        mentor.setCurrentTitle(dto.getCurrentTitle());
        mentor.setUser(user);
        mentor.setStatus("PENDING"); // New applications start as PENDING

        return mapToDTO(mentorRepository.save(mentor));
    }

    @Override
    public List<MentorResponseDTO> getAllMentors() {
        // Sync existing users with MENTOR role who don't have a profile yet
        List<User> mentorUsers = userRepository.findAll().stream()
                .filter(u -> u.getRole() == com.example.demo.Entity.Role.MENTOR)
                .collect(Collectors.toList());

        for (User u : mentorUsers) {
            if (mentorRepository.findByUserId(u.getId()).isEmpty()) {
                Mentor m = new Mentor();
                m.setUser(u);
                m.setStatus("APPROVED"); // Auto-approve existing ones for now
                mentorRepository.save(m);
            }
        }

        return mentorRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public MentorResponseDTO getMentorById(Long id) {
        Mentor mentor = mentorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mentor not found with id: " + id));
        return mapToDTO(mentor);
    }

    @Override
    public MentorResponseDTO getMentorByUserId(Long userId) {
        return mentorRepository.findByUserId(userId)
                .map(this::mapToDTO)
                .orElse(null);
    }

    @Override
    public MentorResponseDTO updateMentor(Long id, Mentor mentorDetails) {
        Mentor mentor = mentorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mentor not found with id: " + id));
        mentor.setExpertise(mentorDetails.getExpertise());
        mentor.setBio(mentorDetails.getBio());
        mentor.setContactNumber(mentorDetails.getContactNumber());
        return mapToDTO(mentorRepository.save(mentor));
    }

    @Override
    public void deleteMentor(Long id) {
        Mentor mentor = mentorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mentor not found with id: " + id));
        mentorRepository.delete(mentor);
    }

    @Override
    public MentorResponseDTO approveMentor(Long id, String status) {
        Mentor mentor = mentorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mentor not found with id: " + id));
        mentor.setStatus(status.toUpperCase());
        return mapToDTO(mentorRepository.save(mentor));
    }

    @Override
    public List<MentorResponseDTO> getPendingMentors() {
        return mentorRepository.findByStatus("PENDING").stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private MentorResponseDTO mapToDTO(Mentor mentor) {
        User user = mentor.getUser();

        List<StartupResponseDTO> startupDTOs = mentor.getStartups().stream()
                .map(startup -> {
                    StartupResponseDTO dto = new StartupResponseDTO();
                    dto.setId(startup.getId());
                    dto.setName(startup.getName());
                    dto.setSector(startup.getSector());
                    dto.setStage(startup.getStage());
                    if (startup.getFounder() != null) {
                        dto.setUserId(startup.getFounder().getId());
                    }
                    return dto;
                })
                .collect(Collectors.toList());

        return new MentorResponseDTO(
                mentor.getId(),
                user != null ? user.getId() : null,
                user != null ? user.getName() : null,
                user != null ? user.getEmail() : null,
                mentor.getExpertise(),
                mentor.getBio(),
                mentor.getContactNumber(),
                mentor.getYearsOfExperience(),
                mentor.getCurrentTitle(),
                mentor.getStatus(),
                startupDTOs);
    }
}
