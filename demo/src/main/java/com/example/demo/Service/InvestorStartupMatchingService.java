package com.example.demo.Service;

import com.example.demo.Entity.InvestorProfile;
import com.example.demo.Entity.Startup;
import com.example.demo.Entity.User;
import com.example.demo.Repositary.StartupRepositary;
import com.example.demo.Repositary.UserRepositary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Investor–Startup Matching Engine
 * 
 * Uses a Weighted Multi-Criteria Scoring Algorithm to rank startups
 * based on how well they align with an investor's stated preferences.
 *
 * Matching Dimensions and Default Weights:
 *   1. Industry Alignment       (w1 = 0.25)
 *   2. Budget Compatibility     (w2 = 0.20)
 *   3. Stage Preference Match   (w3 = 0.15)
 *   4. Equity Range Fit         (w4 = 0.10)
 *   5. Risk-Stage Alignment     (w5 = 0.10)
 *   6. AI Investment Potential   (w6 = 0.15)
 *   7. Traction & Funding Proof (w7 = 0.05)
 *
 * Total Score S(I, S_j) = sum(w_i * score_i) for i = 1..7, normalized to [0, 100].
 */
@Service
@RequiredArgsConstructor
public class InvestorStartupMatchingService {

    private final StartupRepositary startupRepository;
    private final UserRepositary userRepository;

    // Configurable weights (sum = 1.0)
    private static final double W_INDUSTRY   = 0.25;
    private static final double W_BUDGET     = 0.20;
    private static final double W_STAGE      = 0.15;
    private static final double W_EQUITY     = 0.10;
    private static final double W_RISK       = 0.10;
    private static final double W_AI_SCORE   = 0.15;
    private static final double W_TRACTION   = 0.05;

    /**
     * Find and rank matching startups for a given investor user.
     * Returns a list of maps, each containing the startup data and its match score.
     */
    public List<Map<String, Object>> findMatchingStartups(Long investorUserId) {
        User investorUser = userRepository.findById(investorUserId)
                .orElseThrow(() -> new RuntimeException("Investor user not found"));
        InvestorProfile profile = investorUser.getInvestorProfile();

        List<Startup> allStartups = startupRepository.findAll();
        List<Map<String, Object>> rankedResults = new ArrayList<>();

        for (Startup startup : allStartups) {
            double matchScore = computeMatchScore(profile, startup);
            if (matchScore > 0) {
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("startupId", startup.getId());
                entry.put("startupName", startup.getName());
                entry.put("sector", startup.getSector());
                entry.put("stage", startup.getStage());
                entry.put("fundingGoal", startup.getFundingGoal());
                entry.put("availableEquity", startup.getAvailableEquity());
                entry.put("companyValuation", startup.getCompanyValuation());
                entry.put("investmentPotentialTier", startup.getInvestmentPotentialTier());
                entry.put("investmentPotentialScore", startup.getInvestmentPotentialScore());
                entry.put("matchScore", Math.round(matchScore * 100.0) / 100.0);
                entry.put("matchGrade", gradeFromScore(matchScore));
                entry.put("matchReasons", buildMatchReasons(profile, startup));
                if (startup.getFounder() != null) {
                    entry.put("founderId", startup.getFounder().getId());
                    entry.put("founderName", startup.getFounder().getName());
                }
                rankedResults.add(entry);
            }
        }

        // Sort descending by matchScore
        rankedResults.sort((a, b) -> Double.compare(
                (Double) b.get("matchScore"), (Double) a.get("matchScore")));

        return rankedResults;
    }

    /**
     * Core Weighted Scoring Algorithm:
     * S(I, S_j) = w1*S_industry + w2*S_budget + w3*S_stage + w4*S_equity
     *           + w5*S_risk + w6*S_ai + w7*S_traction
     */
    private double computeMatchScore(InvestorProfile investor, Startup startup) {
        if (investor == null) return 25.0; // No profile → base score only

        double sIndustry  = scoreIndustryAlignment(investor, startup);
        double sBudget    = scoreBudgetCompatibility(investor, startup);
        double sStage     = scoreStagePreference(investor, startup);
        double sEquity    = scoreEquityFit(investor, startup);
        double sRisk      = scoreRiskAlignment(investor, startup);
        double sAiScore   = scoreAiPotential(startup);
        double sTraction  = scoreTraction(startup);

        double totalScore = (W_INDUSTRY * sIndustry) + (W_BUDGET * sBudget)
                + (W_STAGE * sStage) + (W_EQUITY * sEquity)
                + (W_RISK * sRisk) + (W_AI_SCORE * sAiScore)
                + (W_TRACTION * sTraction);

        return Math.max(0.0, Math.min(100.0, totalScore));
    }

    // ----- Dimension 1: Industry Alignment (0-100) -----
    private double scoreIndustryAlignment(InvestorProfile investor, Startup startup) {
        if (investor.getInvestmentFocus() == null || startup.getSector() == null) return 50.0;
        Set<String> preferred = parseCommaSeparated(investor.getInvestmentFocus());
        String sector = startup.getSector().trim().toLowerCase();
        for (String pref : preferred) {
            if (sector.contains(pref.toLowerCase()) || pref.toLowerCase().contains(sector)) {
                return 100.0;
            }
        }
        return 20.0; // No match but not zero (investor may still discover new domains)
    }

    // ----- Dimension 2: Budget Compatibility (0-100) -----
    private double scoreBudgetCompatibility(InvestorProfile investor, Startup startup) {
        Double fundingGoal = startup.getFundingGoal();
        if (fundingGoal == null || fundingGoal <= 0) return 50.0;
        Double minInv = investor.getMinInvestmentSize();
        Double maxInv = investor.getMaxInvestmentSize();
        if (minInv == null && maxInv == null) return 50.0;

        double lower = minInv != null ? minInv : 0.0;
        double upper = maxInv != null ? maxInv : Double.MAX_VALUE;

        if (fundingGoal >= lower && fundingGoal <= upper) return 100.0;
        if (fundingGoal < lower) {
            double ratio = fundingGoal / lower;
            return Math.max(10.0, ratio * 100.0);
        }
        // fundingGoal > upper
        double ratio = upper / fundingGoal;
        return Math.max(10.0, ratio * 100.0);
    }

    // ----- Dimension 3: Stage Preference (0-100) -----
    private double scoreStagePreference(InvestorProfile investor, Startup startup) {
        if (investor.getPreferredStages() == null || startup.getStage() == null) return 50.0;
        Set<String> preferred = parseCommaSeparated(investor.getPreferredStages());
        String stage = startup.getStage().trim().toUpperCase();
        for (String pref : preferred) {
            if (pref.trim().toUpperCase().equals(stage)) return 100.0;
        }
        return 15.0;
    }

    // ----- Dimension 4: Equity Range Fit (0-100) -----
    private double scoreEquityFit(InvestorProfile investor, Startup startup) {
        Double equityOffered = startup.getAvailableEquity();
        if (equityOffered == null) return 50.0;
        double equityForSale = 100.0 - equityOffered; // Available equity for investors
        Double prefMin = investor.getPreferredEquityMin();
        Double prefMax = investor.getPreferredEquityMax();
        if (prefMin == null && prefMax == null) return 50.0;

        double minEq = prefMin != null ? prefMin : 0.0;
        double maxEq = prefMax != null ? prefMax : 100.0;

        if (equityForSale >= minEq && equityForSale <= maxEq) return 100.0;
        if (equityForSale < minEq) return Math.max(10.0, (equityForSale / minEq) * 100.0);
        return Math.max(10.0, (maxEq / equityForSale) * 80.0);
    }

    // ----- Dimension 5: Risk-Stage Alignment (0-100) -----
    private double scoreRiskAlignment(InvestorProfile investor, Startup startup) {
        String risk = investor.getRiskTolerance() != null ? investor.getRiskTolerance() : "Medium";
        String stage = startup.getStage() != null ? startup.getStage().toUpperCase() : "IDEA";

        // Map risk tolerance to compatible stages
        switch (risk.toLowerCase()) {
            case "high":
                // High risk investors are comfortable with all stages, prefer IDEA/MVP
                return stage.equals("IDEA") || stage.equals("MVP") ? 100.0 : 70.0;
            case "medium":
                return stage.equals("MVP") || stage.equals("GROWTH") ? 100.0 :
                       stage.equals("SCALING") ? 70.0 : 40.0;
            case "low":
                return stage.equals("SCALING") ? 100.0 :
                       stage.equals("GROWTH") ? 70.0 : 20.0;
            default:
                return 50.0;
        }
    }

    // ----- Dimension 6: AI Investment Potential Score (0-100) -----
    private double scoreAiPotential(Startup startup) {
        if (startup.getInvestmentPotentialScore() != null) {
            return startup.getInvestmentPotentialScore(); // Already 0-100
        }
        // Fallback: map tier to score
        String tier = startup.getInvestmentPotentialTier();
        if (tier == null) return 50.0;
        switch (tier) {
            case "HIGH_POTENTIAL": return 85.0;
            case "MODERATE_POTENTIAL": return 55.0;
            case "LOW_POTENTIAL": return 20.0;
            default: return 50.0;
        }
    }

    // ----- Dimension 7: Traction & Funding Proof (0-100) -----
    private double scoreTraction(Startup startup) {
        double score = 30.0; // base
        if (startup.getTotalFundingRaised() != null && startup.getTotalFundingRaised() > 0) score += 25.0;
        if (startup.getAnnualRevenue() != null && startup.getAnnualRevenue() > 0) score += 25.0;
        if (startup.getMentor() != null) score += 10.0;
        if (startup.getAnnualRevenueGrowth() != null && startup.getAnnualRevenueGrowth() > 20) score += 10.0;
        return Math.min(100.0, score);
    }

    // ----- Match Grade Label -----
    private String gradeFromScore(double score) {
        if (score >= 80) return "EXCELLENT_MATCH";
        if (score >= 60) return "GOOD_MATCH";
        if (score >= 40) return "FAIR_MATCH";
        return "WEAK_MATCH";
    }

    // ----- Build human-readable match reasons -----
    private List<String> buildMatchReasons(InvestorProfile investor, Startup startup) {
        List<String> reasons = new ArrayList<>();
        if (investor == null) {
            reasons.add("Complete your investor profile for personalized matching");
            return reasons;
        }

        // Industry
        if (investor.getInvestmentFocus() != null && startup.getSector() != null) {
            Set<String> prefs = parseCommaSeparated(investor.getInvestmentFocus());
            String sector = startup.getSector().toLowerCase();
            boolean match = prefs.stream().anyMatch(p -> sector.contains(p.toLowerCase()));
            if (match) reasons.add("Industry match: " + startup.getSector() + " aligns with your focus");
        }

        // Budget
        if (startup.getFundingGoal() != null && investor.getMinInvestmentSize() != null) {
            if (startup.getFundingGoal() >= investor.getMinInvestmentSize() &&
                (investor.getMaxInvestmentSize() == null || startup.getFundingGoal() <= investor.getMaxInvestmentSize())) {
                reasons.add("Funding goal within your investment range");
            }
        }

        // Stage
        if (investor.getPreferredStages() != null && startup.getStage() != null) {
            Set<String> prefs = parseCommaSeparated(investor.getPreferredStages());
            if (prefs.stream().anyMatch(p -> p.trim().equalsIgnoreCase(startup.getStage()))) {
                reasons.add("Stage preference match: " + startup.getStage());
            }
        }

        // AI Score
        if ("HIGH_POTENTIAL".equals(startup.getInvestmentPotentialTier())) {
            reasons.add("AI predicts HIGH investment potential");
        }

        if (reasons.isEmpty()) reasons.add("General discovery recommendation");
        return reasons;
    }

    private Set<String> parseCommaSeparated(String csv) {
        if (csv == null || csv.isBlank()) return Collections.emptySet();
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }
}
