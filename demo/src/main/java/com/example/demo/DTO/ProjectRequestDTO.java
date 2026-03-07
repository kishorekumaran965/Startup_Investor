package com.example.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectRequestDTO {
    private String title;
    private String description;
    private Double fundingAmount;
    private String domain;
    private String institution;
    private String status;
    private Long researcherId;

}
