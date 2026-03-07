package com.example.demo.Service;

import com.example.demo.DTO.UserResponseDTO;
import com.example.demo.DTO.ProjectResponseDTO;
import com.example.demo.DTO.StartupResponseDTO;
import com.example.demo.Entity.User;
import java.util.List;

public interface UserService {
    UserResponseDTO saveUser(User user);

    List<UserResponseDTO> getAllUsers();

    UserResponseDTO getUserById(Long id);

    UserResponseDTO updateUser(Long id, User user);

    void deleteUser(Long id, String reason);

    List<ProjectResponseDTO> getProjectsByUserId(Long userId);

    List<StartupResponseDTO> getStartupsByUserId(Long userId);
}
