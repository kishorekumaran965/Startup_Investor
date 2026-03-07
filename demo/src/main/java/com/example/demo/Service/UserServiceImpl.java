package com.example.demo.Service;

import com.example.demo.DTO.UserResponseDTO;
import com.example.demo.DTO.ProjectResponseDTO;
import com.example.demo.DTO.StartupResponseDTO;
import com.example.demo.DTO.InvestmentResponseDTO;
import com.example.demo.Entity.User;
import com.example.demo.Repositary.UserRepositary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;
import com.example.demo.DTO.NotificationResponseDTO;
import com.example.demo.Repositary.NotificationRepositary;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepositary userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final NotificationRepositary notificationRepository;

    private UserResponseDTO convertToDTO(User user) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        if (user.getRole() != null) {
            dto.setRole(user.getRole().toString());
        }
        dto.setProfilePhotoUrl(user.getProfilePhotoUrl());
        dto.setBio(user.getBio());

        // Convert projects to DTOs without researcher to avoid circular reference
        List<ProjectResponseDTO> projectDTOs = user.getProjects().stream()
                .map(project -> {
                    ProjectResponseDTO projectDTO = new ProjectResponseDTO();
                    projectDTO.setId(project.getId());
                    projectDTO.setTitle(project.getTitle());
                    projectDTO.setDescription(project.getDescription());
                    projectDTO.setFundingAmount(project.getFundingAmount());
                    projectDTO.setStatus(project.getStatus());
                    if (project.getResearcher() != null) {
                        projectDTO.setUserId(project.getResearcher().getId());
                    }
                    return projectDTO;
                })
                .collect(Collectors.toList());
        dto.setProjects(projectDTOs);

        // Convert startups to DTOs without founder to avoid circular reference
        List<StartupResponseDTO> startupDTOs = user.getStartups().stream()
                .map(startup -> {
                    StartupResponseDTO startupDTO = new StartupResponseDTO();
                    startupDTO.setId(startup.getId());
                    startupDTO.setName(startup.getName());
                    startupDTO.setSector(startup.getSector());
                    startupDTO.setStage(startup.getStage());
                    if (startup.getFounder() != null) {
                        startupDTO.setUserId(startup.getFounder().getId());
                    }
                    return startupDTO;
                })
                .collect(Collectors.toList());
        dto.setStartups(startupDTOs);

        // Convert investments to DTOs without investor to avoid circular reference
        List<InvestmentResponseDTO> investmentDTOs = user.getInvestments().stream()
                .map(investment -> {
                    InvestmentResponseDTO investmentDTO = new InvestmentResponseDTO();
                    investmentDTO.setId(investment.getId());
                    investmentDTO.setAmount(investment.getAmount());
                    investmentDTO.setInvestmentDate(investment.getInvestmentDate());
                    if (investment.getInvestor() != null) {
                        investmentDTO.setInvestorId(investment.getInvestor().getId());
                    }
                    if (investment.getStartup() != null) {
                        investmentDTO.setStartupId(investment.getStartup().getId());
                    }
                    return investmentDTO;
                })
                .collect(Collectors.toList());
        dto.setInvestments(investmentDTOs);

        // Convert notifications to DTOs
        System.out.println("DEBUG: Fetching notifications for user ID: " + user.getId());
        List<NotificationResponseDTO> notificationDTOs = notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(n -> new NotificationResponseDTO(n.getId(), n.getContent(), n.getType(), n.getRelatedId(),
                        n.isReadStatus(),
                        n.getCreatedAt()))
                .collect(Collectors.toList());
        System.out.println("DEBUG: Found " + notificationDTOs.size() + " notifications for user " + user.getId());
        dto.setNotifications(notificationDTOs);

        return dto;
    }

    @Override
    public UserResponseDTO saveUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User saved = userRepository.save(user);
        return convertToDTO(saved);
    }

    @Override
    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public UserResponseDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));
        return convertToDTO(user);
    }

    @Override
    public UserResponseDTO updateUser(Long id, User user) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));
        existingUser.setName(user.getName());
        existingUser.setEmail(user.getEmail());
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            existingUser.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        existingUser.setRole(user.getRole());
        if (user.getProfilePhotoUrl() != null) {
            existingUser.setProfilePhotoUrl(user.getProfilePhotoUrl());
        }
        if (user.getBio() != null) {
            existingUser.setBio(user.getBio());
        }
        User updated = userRepository.save(existingUser);
        return convertToDTO(updated);
    }

    @Override
    public void deleteUser(Long id, String reason) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));

        System.out.println("⚠️ [ADMIN ACTION] Deleting user: " + user.getEmail());
        System.out.println("📄 Reason for deletion: " + (reason != null ? reason : "No reason provided"));

        userRepository.deleteById(id);
    }

    @Override
    public List<ProjectResponseDTO> getProjectsByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        return user.getProjects().stream()
                .map(project -> {
                    ProjectResponseDTO projectDTO = new ProjectResponseDTO();
                    projectDTO.setId(project.getId());
                    projectDTO.setTitle(project.getTitle());
                    projectDTO.setDescription(project.getDescription());
                    projectDTO.setFundingAmount(project.getFundingAmount());
                    projectDTO.setStatus(project.getStatus());
                    if (project.getResearcher() != null) {
                        projectDTO.setUserId(project.getResearcher().getId());
                    }
                    return projectDTO;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<StartupResponseDTO> getStartupsByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        return user.getStartups().stream()
                .map(startup -> {
                    StartupResponseDTO startupDTO = new StartupResponseDTO();
                    startupDTO.setId(startup.getId());
                    startupDTO.setName(startup.getName());
                    startupDTO.setSector(startup.getSector());
                    startupDTO.setStage(startup.getStage());
                    if (startup.getFounder() != null) {
                        startupDTO.setUserId(startup.getFounder().getId());
                    }
                    return startupDTO;
                })
                .collect(Collectors.toList());
    }
}
