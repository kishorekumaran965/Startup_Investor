package com.example.demo.Repositary;

import com.example.demo.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.demo.Entity.Role;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepositary extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    List<User> findByRole(Role role);
}
