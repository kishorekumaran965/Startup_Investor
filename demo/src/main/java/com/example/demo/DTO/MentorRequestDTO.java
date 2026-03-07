package com.example.demo.DTO;

import lombok.Data;

@Data
public class MentorRequestDTO {
    private String expertise;
    private String bio;
    private String contactNumber;
    private Integer yearsOfExperience;
    private String currentTitle;
    private Long userId;
}
