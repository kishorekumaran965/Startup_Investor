package com.example.demo.DTO;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(Include.NON_NULL)
public class InvestmentResponseDTO {
    private Long id;
    private Double amount;
    private LocalDate investmentDate;
    private Long investorId;
    private UserResponseDTO investor;
    private Long startupId;
    private StartupResponseDTO startup;
}
