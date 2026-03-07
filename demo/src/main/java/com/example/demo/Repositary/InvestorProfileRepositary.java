package com.example.demo.Repositary;

import com.example.demo.Entity.InvestorProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InvestorProfileRepositary extends JpaRepository<InvestorProfile, Long> {
    java.util.Optional<InvestorProfile> findByUserId(Long userId);
}
