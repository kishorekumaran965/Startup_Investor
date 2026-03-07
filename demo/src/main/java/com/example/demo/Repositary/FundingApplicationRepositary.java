package com.example.demo.Repositary;

import com.example.demo.Entity.FundingApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FundingApplicationRepositary extends JpaRepository<FundingApplication, Long> {
    List<FundingApplication> findByInvestorId(Long investorId);

    List<FundingApplication> findByStartupId(Long startupId);
}
