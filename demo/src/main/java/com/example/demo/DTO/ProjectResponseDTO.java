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
public class ProjectResponseDTO {
    private Long id;
    private String title;
    private String description;
    private Double fundingAmount;
    private String domain;
    private String institution;
    private String status;
    private Long userId;

    private UserResponseDTO researcher;
    private List<PatentResponseDTO> patents;
}
