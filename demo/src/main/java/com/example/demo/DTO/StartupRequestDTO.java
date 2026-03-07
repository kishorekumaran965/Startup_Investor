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
