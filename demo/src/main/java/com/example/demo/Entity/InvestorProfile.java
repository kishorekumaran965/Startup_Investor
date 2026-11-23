package com.example.demo.Entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class InvestorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firmName;

    private String investmentFocus; // e.g., "Technology,FinTech,Healthcare" (comma-separated)

    private Double minInvestmentSize;

    private Double maxInvestmentSize;

    private String bio;

    // --- Investment Preferences for Matching Algorithm ---

    private String investorType = "Individual"; // Individual, Angel Investor, Venture Capital, Investment Company

    private String location; // e.g., "India", "Bengaluru"

    @Column(columnDefinition = "double default 0.0")
    private Double totalInvestmentBudget = 0.0;

    @Column(columnDefinition = "double default 0.0")
    private Double availableCapital = 0.0;

    private String preferredStages; // e.g., "IDEA,MVP,GROWTH" (comma-separated)

    private String preferredBusinessModels; // e.g., "B2B SaaS,Marketplace" (comma-separated)

    private String preferredLocations; // e.g., "India,Tamil Nadu" (comma-separated)

    private String riskTolerance = "Medium"; // Low, Medium, High

    private String investmentStrategy = "Balanced"; // Conservative, Balanced, Aggressive

    @Column(columnDefinition = "double default 5.0")
    private Double preferredEquityMin = 5.0;

    @Column(columnDefinition = "double default 25.0")
    private Double preferredEquityMax = 25.0;

    private String investmentHorizon = "3-5 years"; // "1-2 years", "3-5 years", "5+ years"

    @Column(columnDefinition = "integer default 0")
    private Integer previousInvestmentCount = 0;

    @Column(columnDefinition = "integer default 0")
    private Integer successfulInvestments = 0;

    private String investmentExperience = "Beginner"; // Beginner, Intermediate, Experienced

    @Column(columnDefinition = "double default 0.0")
    private Double expectedReturnPercentage = 0.0;

    @JsonIgnore
    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;
}
