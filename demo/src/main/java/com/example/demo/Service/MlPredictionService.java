package com.example.demo.Service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import com.example.demo.Entity.Startup;
import com.example.demo.Repositary.StartupRepositary;
import lombok.RequiredArgsConstructor;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MlPredictionService {

    private final StartupRepositary startupRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final String ML_ENDPOINT = "http://localhost:8000/v1/predict";

    public Map<String, Object> evaluateStartupPotential(Long startupId) {
        Startup startup = startupRepository.findById(startupId)
                .orElseThrow(() -> new RuntimeException("Startup not found with ID: " + startupId));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> payload = new HashMap<>();
        payload.put("startup_id", startup.getId());
        payload.put("sector", startup.getSector() != null ? startup.getSector() : "Technology");
        payload.put("stage", startup.getStage() != null ? startup.getStage() : "IDEA");
        payload.put("business_model", "B2B SaaS");
        payload.put("annualRevenue", startup.getAnnualRevenue() != null ? startup.getAnnualRevenue() : 0.0);
        payload.put("monthlyRevenue", startup.getMonthlyRevenue() != null ? startup.getMonthlyRevenue() : 0.0);
        payload.put("annualRevenueGrowth", startup.getAnnualRevenueGrowth() != null ? startup.getAnnualRevenueGrowth() : 0.0);
        payload.put("netProfitLoss", startup.getNetProfitLoss() != null ? startup.getNetProfitLoss() : 0.0);
        payload.put("monthlyExpenses", startup.getMonthlyExpenses() != null ? startup.getMonthlyExpenses() : 0.0);
        payload.put("cashBalance", startup.getCashBalance() != null ? startup.getCashBalance() : 0.0);
        payload.put("monthlyBurnRate", startup.getMonthlyBurnRate() != null ? startup.getMonthlyBurnRate() : 0.0);
        payload.put("runwayMonths", startup.getRunwayMonths() != null ? startup.getRunwayMonths() : 12);
        payload.put("fundingGoal", startup.getFundingGoal() != null ? startup.getFundingGoal() : 100000.0);
        payload.put("companyValuation", startup.getCompanyValuation() != null ? startup.getCompanyValuation() : 1000000.0);
        payload.put("totalFundingRaised", startup.getTotalFundingRaised() != null ? startup.getTotalFundingRaised() : 0.0);
        payload.put("debt", startup.getDebt() != null ? startup.getDebt() : 0.0);
        payload.put("cac", startup.getCac() != null ? startup.getCac() : 0.0);
        payload.put("ltv", startup.getLtv() != null ? startup.getLtv() : 0.0);
        payload.put("team_experience_years", startup.getMentor() != null ? 8.0 : 4.0);
        payload.put("founder_exits", 0);
        payload.put("market_size_tam", 2500.0);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(ML_ENDPOINT, entity, Map.class);
            Map<String, Object> body = response.getBody();
            if (body != null) {
                String tier = (String) body.get("investment_potential_tier");
                Object scoreObj = body.get("investment_potential_score");
                Double score = scoreObj instanceof Number ? ((Number) scoreObj).doubleValue() : null;

                startup.setInvestmentPotentialTier(tier);
                if (score != null) {
                    startup.setInvestmentPotentialScore(score);
                }
                startupRepository.save(startup);
                return body;
            }
        } catch (Exception e) {
            // Fallback to internal heuristic if Python microservice is not currently running
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("startup_id", startup.getId());
            fallback.put("algorithm_used", "Spring_Boot_Internal_Engine");
            fallback.put("investment_potential_tier", startup.getInvestmentPotentialTier() != null ? startup.getInvestmentPotentialTier() : "MODERATE_POTENTIAL");
            fallback.put("investment_potential_score", startup.getInvestmentPotentialScore() != null ? startup.getInvestmentPotentialScore() : 55.0);
            fallback.put("note", "Fallback evaluation applied. Start Python ml_service on port 8000 for full ML inference.");
            return fallback;
        }

        Map<String, Object> err = new HashMap<>();
        err.put("error", "Unable to evaluate");
        return err;
    }
}
