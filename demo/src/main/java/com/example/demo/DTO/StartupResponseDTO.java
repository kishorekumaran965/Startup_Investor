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
public class StartupResponseDTO {
    private Long id;
    private String name;
    private String description;
    private String sector;
    private String industry; // alias for sector, returned for frontend compatibility
    private String stage;
    private Double fundingGoal;
    private Long userId;
    private UserResponseDTO founder;
    private List<FundingResponseDTO> fundings;
    private List<InvestmentResponseDTO> investments;
    private Long mentorId;
}
