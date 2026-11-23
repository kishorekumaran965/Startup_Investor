package com.example.demo.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Startup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String description;

    private String sector;

    private String stage; // Idea / Prototype / Scaling

    private Double fundingGoal;

    @ManyToOne
    @JoinColumn(name = "founder_id")
    private User founder;

    @JsonIgnore
    @OneToMany(mappedBy = "startup", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Funding> fundings = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "startup", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Investment> investments = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "startup", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<FundingApplication> fundingApplications = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "mentor_id")
    private Mentor mentor;

    @Column(nullable = false, columnDefinition = "bigint default 10000000")
    private Long totalAuthorizedShares = 10000000L;

    @Column(nullable = false, columnDefinition = "double default 100.0")
    private Double availableEquity = 100.0;

    // --- Financial Details for AI Investment Potential Prediction ---
    @Column(columnDefinition = "double default 0.0")
    private Double annualRevenue = 0.0;

    @Column(columnDefinition = "double default 0.0")
    private Double monthlyRevenue = 0.0;

    @Column(columnDefinition = "double default 0.0")
    private Double annualRevenueGrowth = 0.0;

    @Column(columnDefinition = "double default 0.0")
    private Double netProfitLoss = 0.0;

    @Column(columnDefinition = "double default 0.0")
    private Double profitMargin = 0.0;

    @Column(columnDefinition = "double default 0.0")
    private Double monthlyExpenses = 0.0;

    @Column(columnDefinition = "double default 0.0")
    private Double cashBalance = 0.0;

    @Column(columnDefinition = "double default 0.0")
    private Double monthlyBurnRate = 0.0;

    @Column(columnDefinition = "integer default 12")
    private Integer runwayMonths = 12;

    @Column(columnDefinition = "double default 0.0")
    private Double totalFundingRaised = 0.0;

    @Column(columnDefinition = "double default 0.0")
    private Double companyValuation = 0.0;

    @Column(columnDefinition = "double default 0.0")
    private Double debt = 0.0;

    @Column(columnDefinition = "double default 0.0")
    private Double cac = 0.0;

    @Column(columnDefinition = "double default 0.0")
    private Double ltv = 0.0;

    @Column(columnDefinition = "double default 0.0")
    private Double recurringRevenue = 0.0;

    @Column(columnDefinition = "double default 0.0")
    private Double grossProfitMargin = 0.0;

    @Column(columnDefinition = "double default 0.0")
    private Double totalAssets = 0.0;

    @Column(columnDefinition = "double default 0.0")
    private Double totalLiabilities = 0.0;

    private String breakEvenStatus = "Pre-Breakeven"; // "Pre-Breakeven" or "Profitable" / "Breakeven"

    // Investment potential prediction cache / score
    private String investmentPotentialTier; // "HIGH_POTENTIAL", "MODERATE_POTENTIAL", "LOW_POTENTIAL"
    private Double investmentPotentialScore; // 0.0 - 100.0 or 0.0 - 1.0 confidence

    @JsonIgnore
    @OneToMany(mappedBy = "startup", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CapTableEntry> capTable = new ArrayList<>();
}
