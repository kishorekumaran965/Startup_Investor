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
public class InvestmentRequestDTO {
    private Double amount;
    private LocalDate investmentDate;
    private Long investorId;
    private Long startupId;
}
