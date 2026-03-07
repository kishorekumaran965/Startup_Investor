package com.example.demo.Controller;

import com.example.demo.DTO.UserResponseDTO;
import com.example.demo.DTO.ProjectResponseDTO;
import com.example.demo.DTO.StartupResponseDTO;
import com.example.demo.Entity.User;
import com.example.demo.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    @PostMapping
    public UserResponseDTO createUser(@RequestBody User user) {
        return userService.saveUser(user);
    }

    @GetMapping
    public List<UserResponseDTO> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public UserResponseDTO getUserById(@PathVariable("id") Long id) {
        return userService.getUserById(id);
    }

    @PutMapping("/{id}")
    public UserResponseDTO updateUser(@PathVariable("id") Long id, @RequestBody User user) {
        return userService.updateUser(id, user);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable("id") Long id, @RequestParam(required = false) String reason) {
        userService.deleteUser(id, reason);
    }

    @GetMapping("/{id}/projects")
    public List<ProjectResponseDTO> getUserProjects(@PathVariable("id") Long id) {
        return userService.getProjectsByUserId(id);
    }

    @GetMapping("/{id}/startups")
    public List<StartupResponseDTO> getUserStartups(@PathVariable("id") Long id) {
        return userService.getStartupsByUserId(id);
    }
}
