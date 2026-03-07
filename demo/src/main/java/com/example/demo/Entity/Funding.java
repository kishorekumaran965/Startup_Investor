package com.example.demo.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Funding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double amount;

    private String fundingSource;

    @Enumerated(EnumType.STRING)
    private FundingType fundingType;

    private String status;          // APPROVED, PENDING, REJECTED

    private LocalDate fundingDate;

    @ManyToOne
    @JoinColumn(name = "startup_id")
    private Startup startup;
}
