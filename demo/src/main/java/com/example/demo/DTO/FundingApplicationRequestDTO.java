package com.example.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FundingApplicationRequestDTO {
    private Long startupId;
    private Long investorId;
    private Double amount;
    private Double equityOffered;
    private String message;
}
