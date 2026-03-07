package com.example.demo.Config;

import com.example.demo.Entity.Role;
import com.example.demo.Entity.User;
import com.example.demo.Repositary.UserRepositary;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepositary userRepositary;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepositary.findByEmail("admin@miniproject.com").isEmpty()) {
            User admin = new User();
            admin.setName("System Admin");
            admin.setEmail("admin@miniproject.com");
            admin.setPassword(passwordEncoder.encode("admin123")); // Replace with a secure password
            admin.setRole(Role.ADMIN);
            userRepositary.save(admin);
            System.out.println("✅ Default Admin User created: admin@miniproject.com / admin123");
        } else {
            System.out.println("✅ Admin User already exists.");
        }
    }
}
