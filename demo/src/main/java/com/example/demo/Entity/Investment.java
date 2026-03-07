package com.example.demo.Entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Investment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double amount;

    private LocalDate investmentDate;

    @ManyToOne
    @JoinColumn(name = "investor_id")
    private User investor;
    @ManyToOne
    @JoinColumn(name = "startup_id")
    private Startup startup;

}
