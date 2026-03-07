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
public class FundingRequestDTO {
    private Double amount;
    private String fundingSource;
    private String fundingType;
    private String status;
    private LocalDate fundingDate;
    private Long startupId;
}
