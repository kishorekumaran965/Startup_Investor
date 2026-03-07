package com.example.demo.DTO;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InvestorProfileResponseDTO {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String firmName;
    private String investmentFocus;
    private Double minInvestmentSize;
    private Double maxInvestmentSize;
    private String bio;
}
