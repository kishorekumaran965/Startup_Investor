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

    @JsonIgnore
    @OneToMany(mappedBy = "startup", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CapTableEntry> capTable = new ArrayList<>();
}
