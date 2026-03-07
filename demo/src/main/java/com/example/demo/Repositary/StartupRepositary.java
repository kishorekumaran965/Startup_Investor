package com.example.demo.Repositary;

import com.example.demo.Entity.Startup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StartupRepositary extends JpaRepository<Startup, Long> {

}
