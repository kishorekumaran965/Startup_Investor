package com.example.demo.Repositary;

import com.example.demo.Entity.Investment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InvestmentRepositary extends JpaRepository<Investment, Long> {

}
