package com.example.demo.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class FundingApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "startup_id")
    private Startup startup;

    @ManyToOne
    @JoinColumn(name = "investor_id")
    private User investor;

    private Double amount;

    private String message;

    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    private LocalDate applicationDate = LocalDate.now();
}
