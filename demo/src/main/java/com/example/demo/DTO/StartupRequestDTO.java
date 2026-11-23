package com.example.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StartupRequestDTO {
    private String name;
    private String description;

    // Accept both "industry" (frontend) and "sector" (legacy)
    private String industry;
    private String sector;

    private String stage;
    private Double fundingGoal;

    // Financial Details
    private Double annualRevenue;
    private Double monthlyRevenue;
    private Double annualRevenueGrowth;
    private Double netProfitLoss;
    private Double profitMargin;
    private Double monthlyExpenses;
    private Double cashBalance;
    private Double monthlyBurnRate;
    private Integer runwayMonths;
    private Double totalFundingRaised;
    private Double companyValuation;
    private Double debt;
    private Double cac;
    private Double ltv;
    private Double recurringRevenue;
    private Double grossProfitMargin;
    private Double totalAssets;
    private Double totalLiabilities;
    private String breakEvenStatus;
    private Double availableEquity;

    // Accept both "userId" (frontend) and "founderId" (legacy)
    private Long userId;
    private Long founderId;

    // Helper: resolve whichever owner ID was provided
    public Long getResolvedFounderId() {
        return founderId != null ? founderId : userId;
    }

    // Helper: resolve whichever industry/sector was provided
    public String getResolvedSector() {
        return sector != null ? sector : industry;
    }
}
