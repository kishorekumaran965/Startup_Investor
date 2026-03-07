package com.example.demo.DTO;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(Include.NON_NULL)
public class UserResponseDTO {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String profilePhotoUrl;
    private String bio;
    private List<ProjectResponseDTO> projects;
    private List<StartupResponseDTO> startups;
    private List<InvestmentResponseDTO> investments;
    private List<NotificationResponseDTO> notifications;
    private String lastMessage;
    private java.time.LocalDateTime lastMessageTime;
}
