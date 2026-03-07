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
public class FundingResponseDTO {
    private Long id;
    private Double amount;
    private String fundingSource;
    private String fundingType;
    private String status;
    private LocalDate fundingDate;
    private Long startupId;
    private StartupResponseDTO startup;
}
