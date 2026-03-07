package com.example.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FundingApplicationResponseDTO {
    private Long id;
    private Long startupId;
    private String startupName;
    private Long investorId;
    private String investorName;
    private Double amount;
    private String message;
    private String status; // PENDING, APPROVED, REJECTED
    private LocalDate applicationDate;
}
