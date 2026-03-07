package com.example.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MentorResponseDTO {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String expertise;
    private String bio;
    private String contactNumber;
    private Integer yearsOfExperience;
    private String currentTitle;
    private String status;
    private List<StartupResponseDTO> startups;
}
