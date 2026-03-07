package com.example.demo.Repositary;

import com.example.demo.Entity.Funding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FundingRepositary extends JpaRepository<Funding, Long> {

}
