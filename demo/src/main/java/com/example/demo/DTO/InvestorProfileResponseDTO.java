package com.example.demo.DTO;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(Include.NON_NULL)
public class InvestorProfileResponseDTO {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String firmName;
    private String investmentFocus;
    private Double minInvestmentSize;
    private Double maxInvestmentSize;
    private String bio;

    // Matching preferences
    private String investorType;
    private String location;
    private Double totalInvestmentBudget;
    private Double availableCapital;
    private String preferredStages;
    private String preferredBusinessModels;
    private String preferredLocations;
    private String riskTolerance;
    private String investmentStrategy;
    private Double preferredEquityMin;
    private Double preferredEquityMax;
    private String investmentHorizon;
    private Integer previousInvestmentCount;
    private Integer successfulInvestments;
    private String investmentExperience;
    private Double expectedReturnPercentage;
}
