package com.example.demo.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class CapTableEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "startup_id")
    private Startup startup;

    private String ownerName;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User ownerUser; // Optional: Links to a local user account

    private String ownerType; // FOUNDER, INVESTOR, EMPLOYEE, etc.

    private Long shares;

    private Double ownershipPercentage; // Calculated field (shares / totalShares)
}
