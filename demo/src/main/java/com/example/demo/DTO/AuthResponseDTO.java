package com.example.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class AuthResponseDTO {
    private Long id;
    private String token;
    private String email;
    private String name;
    private String role;
    private String message;
}
