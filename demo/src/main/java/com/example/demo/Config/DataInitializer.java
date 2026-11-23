package com.example.demo.Config;

import com.example.demo.Entity.Role;
import com.example.demo.Entity.Startup;
import com.example.demo.Entity.User;
import com.example.demo.Entity.CapTableEntry;
import com.example.demo.Repositary.StartupRepositary;
import com.example.demo.Repositary.UserRepositary;
import com.example.demo.Repositary.CapTableRepositary;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepositary userRepositary;
    private final StartupRepositary startupRepository;
    private final CapTableRepositary capTableRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        User admin;
        if (userRepositary.findByEmail("admin@miniproject.com").isEmpty()) {
            admin = new User();
            admin.setName("System Admin");
            admin.setEmail("admin@miniproject.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(Role.ADMIN);
            admin = userRepositary.save(admin);
            System.out.println("✅ Default Admin User created: admin@miniproject.com / admin123");
        } else {
            admin = userRepositary.findByEmail("admin@miniproject.com").get();
            System.out.println("✅ Admin User already exists.");
        }

        // Create sample founder user if none exists
        User founder;
        if (userRepositary.findByEmail("founder@miniproject.com").isEmpty()) {
            founder = new User();
            founder.setName("Arjun Mehta");
            founder.setEmail("founder@miniproject.com");
            founder.setPassword(passwordEncoder.encode("founder123"));
            founder.setRole(Role.STARTUP);
            founder = userRepositary.save(founder);
            System.out.println("✅ Sample Founder created: founder@miniproject.com / founder123");
        } else {
            founder = userRepositary.findByEmail("founder@miniproject.com").get();
        }

        // Seed diverse sample startups if repository is empty
        if (startupRepository.count() == 0) {
            seedSampleStartups(founder);
            System.out.println("✅ Sample Startups successfully seeded for ecosystem exploration.");
        }
    }

    private void seedSampleStartups(User founder) {
        // Startup 1: FinTech
        createStartup(
            "PayPulse Analytics",
            "Next-generation B2B automated cash-flow forecasting and cross-border API payments platform for SMEs.",
            "Finance", "GROWTH", 350000.0, 5000000.0, 15.0,
            240000.0, 45.0, -10000.0, 280000.0, 9000.0, 24, 150000.0,
            "HIGH_POTENTIAL", 88.0, founder
        );

        // Startup 2: AI / Healthcare
        createStartup(
            "NeuroDiagnostic AI",
            "Deep-learning computer vision platform analyzing MRI scans for early detection of neurological disorders.",
            "Healthcare", "MVP", 500000.0, 4000000.0, 12.5,
            60000.0, 80.0, -25000.0, 180000.0, 12000.0, 14, 80000.0,
            "HIGH_POTENTIAL", 82.0, founder
        );

        // Startup 3: Technology / SaaS
        createStartup(
            "CloudMesh Security",
            "Zero-trust continuous identity authentication and cloud perimeter defense for hybrid engineering teams.",
            "Technology", "SCALING", 1200000.0, 15000000.0, 8.0,
            1400000.0, 55.0, 120000.0, 900000.0, 15000.0, 36, 1000000.0,
            "HIGH_POTENTIAL", 92.0, founder
        );

        // Startup 4: Sustainability / CleanTech
        createStartup(
            "EcoGrid Smart Storage",
            "Distributed AI-managed battery energy storage systems for commercial solar microgrids and smart buildings.",
            "Sustainability", "MVP", 300000.0, 3000000.0, 10.0,
            40000.0, 20.0, -12000.0, 95000.0, 8000.0, 11, 50000.0,
            "MODERATE_POTENTIAL", 64.0, founder
        );

        // Startup 5: Education
        createStartup(
            "SkillForge VR",
            "Immersive virtual reality vocational training simulators for industrial manufacturing and robotics.",
            "Education", "IDEA", 150000.0, 1500000.0, 10.0,
            0.0, 0.0, -4000.0, 35000.0, 3500.0, 10, 0.0,
            "MODERATE_POTENTIAL", 52.0, founder
        );
    }

    private void createStartup(
        String name, String desc, String sector, String stage, Double goal, Double val, Double equity,
        Double rev, Double growth, Double netProfit, Double cash, Double burn, Integer runway, Double raised,
        String tier, Double score, User founder
    ) {
        Startup s = new Startup();
        s.setName(name);
        s.setDescription(desc);
        s.setSector(sector);
        s.setStage(stage);
        s.setFundingGoal(goal);
        s.setCompanyValuation(val);
        s.setAvailableEquity(100.0 - equity);
        s.setAnnualRevenue(rev);
        s.setAnnualRevenueGrowth(growth);
        s.setNetProfitLoss(netProfit);
        s.setCashBalance(cash);
        s.setMonthlyBurnRate(burn);
        s.setRunwayMonths(runway);
        s.setTotalFundingRaised(raised);
        s.setInvestmentPotentialTier(tier);
        s.setInvestmentPotentialScore(score);
        s.setFounder(founder);

        Startup saved = startupRepository.save(s);

        CapTableEntry founderEntry = new CapTableEntry();
        founderEntry.setStartup(saved);
        founderEntry.setOwnerName(founder.getName());
        founderEntry.setOwnerUser(founder);
        founderEntry.setOwnerType("FOUNDER");
        founderEntry.setShares(saved.getTotalAuthorizedShares());
        founderEntry.setOwnershipPercentage(100.0 - equity);
        capTableRepository.save(founderEntry);
    }
}

