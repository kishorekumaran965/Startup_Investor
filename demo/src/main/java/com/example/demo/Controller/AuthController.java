package com.example.demo.Controller;

import com.example.demo.DTO.AuthResponseDTO;
import com.example.demo.DTO.LoginRequestDTO;
import com.example.demo.DTO.RegisterRequestDTO;
import com.example.demo.Entity.Role;
import com.example.demo.Entity.User;
import com.example.demo.Entity.Mentor;
import com.example.demo.Entity.InvestorProfile;
import com.example.demo.Repositary.MentorRepositary;
import com.example.demo.Repositary.InvestorProfileRepositary;
import com.example.demo.Repositary.UserRepositary;
import com.example.demo.Security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

        private final UserRepositary userRepository;
        private final MentorRepositary mentorRepository;
        private final InvestorProfileRepositary investorProfileRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtUtil jwtUtil;
        private final AuthenticationManager authenticationManager;

        @PostMapping("/register")
        public ResponseEntity<?> register(@RequestBody RegisterRequestDTO request) {
                // Check if email already exists
                if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                        .body("Email already registered");
                }

                // Create new user
                User user = new User();
                user.setName(request.getName());
                user.setEmail(request.getEmail());
                user.setPassword(passwordEncoder.encode(request.getPassword()));
                user.setRole(Role.valueOf(request.getRole().toUpperCase()));

                User savedUser = userRepository.save(user);

                // Create associated profiles for specific roles
                if (user.getRole() == Role.MENTOR) {
                        Mentor mentor = new Mentor();
                        mentor.setUser(savedUser);
                        mentor.setStatus("PENDING");
                        mentorRepository.save(mentor);
                } else if (user.getRole() == Role.INVESTOR) {
                        InvestorProfile investor = new InvestorProfile();
                        investor.setUser(savedUser);
                        investorProfileRepository.save(investor);
                }

                // Generate token
                String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(new AuthResponseDTO(user.getId(), token, user.getEmail(), user.getName(),
                                                user.getRole().name(),
                                                "Registration successful"));
        }

        @PostMapping("/login")
        public ResponseEntity<?> login(@RequestBody LoginRequestDTO request) {
                try {
                        authenticationManager.authenticate(
                                        new UsernamePasswordAuthenticationToken(request.getEmail(),
                                                        request.getPassword()));
                } catch (BadCredentialsException e) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                        .body("Invalid email or password");
                }

                User user = userRepository.findByEmail(request.getEmail())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

                return ResponseEntity
                                .ok(new AuthResponseDTO(user.getId(), token, user.getEmail(), user.getName(),
                                                user.getRole().name(),
                                                "Login successful"));
        }
}
