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

    private String investmentFocus; // e.g., Fintech, AI, Healthcare

    private Double minInvestmentSize;

    private Double maxInvestmentSize;

    private String bio;

    @JsonIgnore
    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;
}
