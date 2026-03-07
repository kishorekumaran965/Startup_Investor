package com.example.demo.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequestDTO {
    private String name;
    private String email;
    private String password;
    private String role; // ADMIN, RESEARCHER, STARTUP, INVESTOR, MENTOR
}
