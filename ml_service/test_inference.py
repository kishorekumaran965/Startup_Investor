"""
Simple test script to verify inference against the trained model
"""
import os
import joblib
import pandas as pd

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(CURRENT_DIR, "best_startup_classifier.joblib")

artifact = joblib.load(MODEL_PATH)
pipeline = artifact["pipeline"]
inverse_mapping = artifact["inverse_mapping"]

sample_startup = pd.DataFrame([{
    "sector": "FinTech",
    "stage": "GROWTH",
    "business_model": "B2B SaaS",
    "annualRevenue": 350000.0,
    "monthlyRevenue": 30000.0,
    "annualRevenueGrowth": 55.0,
    "netProfitLoss": -5000.0,
    "monthlyExpenses": 35000.0,
    "cashBalance": 400000.0,
    "monthlyBurnRate": 8000.0,
    "runwayMonths": 24,
    "fundingGoal": 1200000.0,
    "companyValuation": 12000000.0,
    "totalFundingRaised": 500000.0,
    "debt": 0.0,
    "cac": 150.0,
    "ltv": 650.0,
    "team_experience_years": 12.0,
    "founder_exits": 1,
    "market_size_tam": 6000.0
}])

probs = pipeline.predict_proba(sample_startup)[0]
pred_idx = probs.argmax()
tier = inverse_mapping[pred_idx]

print("\n--- SAMPLE STARTUP INFERENCE TEST ---")
print(f"Algorithm: {artifact['algorithm_name']}")
print(f"Predicted Tier: {tier}")
print(f"Probabilities: {dict(zip(inverse_mapping.values(), [round(p, 4) for p in probs]))}")
print(f"Confidence: {probs.max():.2%}")
