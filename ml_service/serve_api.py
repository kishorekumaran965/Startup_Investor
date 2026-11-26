"""
FastAPI Microservice for Startup Investment Potential Inference
Serves predictions, confidence scores, and explainability drivers.
"""

import os
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any

app = FastAPI(
    title="Startup Investment Potential Prediction Service",
    description="Machine Learning Inference Engine for Venture Evaluation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(CURRENT_DIR, "best_startup_classifier.joblib")

# Load model artifact
try:
    artifact = joblib.load(MODEL_PATH)
    pipeline = artifact["pipeline"]
    inverse_mapping = artifact["inverse_mapping"]
    algorithm_name = artifact.get("algorithm_name", "Trained_Classifier")
    print(f"Loaded ML Pipeline: {algorithm_name} from {MODEL_PATH}")
except Exception as e:
    print(f"Warning: Could not load model ({e}). Prediction endpoint will return 503 until trained.")
    pipeline = None
    inverse_mapping = {0: "LOW_POTENTIAL", 1: "MODERATE_POTENTIAL", 2: "HIGH_POTENTIAL"}
    algorithm_name = "None"

class StartupEvaluationRequest(BaseModel):
    startup_id: Optional[int] = 1
    sector: Optional[str] = "Technology"
    stage: Optional[str] = "IDEA"
    business_model: Optional[str] = "B2B SaaS"
    annualRevenue: Optional[float] = 0.0
    monthlyRevenue: Optional[float] = 0.0
    annualRevenueGrowth: Optional[float] = 0.0
    netProfitLoss: Optional[float] = 0.0
    monthlyExpenses: Optional[float] = 0.0
    cashBalance: Optional[float] = 0.0
    monthlyBurnRate: Optional[float] = 0.0
    runwayMonths: Optional[int] = 12
    fundingGoal: Optional[float] = 100000.0
    companyValuation: Optional[float] = 1000000.0
    totalFundingRaised: Optional[float] = 0.0
    debt: Optional[float] = 0.0
    cac: Optional[float] = 0.0
    ltv: Optional[float] = 0.0
    team_experience_years: Optional[float] = 5.0
    founder_exits: Optional[int] = 0
    market_size_tam: Optional[float] = 1000.0

class StartupEvaluationResponse(BaseModel):
    startup_id: Optional[int]
    algorithm_used: str
    investment_potential_tier: str
    investment_potential_score: float
    confidence_score: float
    probabilities: Dict[str, float]
    key_drivers: List[str]
    risk_factors: List[str]
 
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "model_loaded": pipeline is not None,
        "algorithm": algorithm_name
    }

@app.post("/v1/predict", response_model=StartupEvaluationResponse)
def predict_investment_potential(data: StartupEvaluationRequest):
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Model artifact is not loaded. Run train_pipeline.py first.")

    input_dict = data.dict()
    df = pd.DataFrame([input_dict])

    # Obtain class probabilities
    probs = pipeline.predict_proba(df)[0]
    predicted_class_idx = int(np.argmax(probs))
    tier = inverse_mapping.get(predicted_class_idx, "MODERATE_POTENTIAL")

    prob_dict = {
        inverse_mapping.get(i, f"Class_{i}"): round(float(probs[i]), 4)
        for i in range(len(probs))
    }

    confidence = float(np.max(probs))
    
    # Calculate composite score from 0 - 100
    # High: class 2, Moderate: class 1, Low: class 0
    score = float((probs[2] * 100.0) + (probs[1] * 50.0))
    score = round(min(100.0, max(0.0, score)), 2)

    # Explainability: Extract key drivers and risk factors
    key_drivers = []
    risk_factors = []

    if (data.runwayMonths or 0) >= 12:
        key_drivers.append(f"Healthy Runway Horizon: {data.runwayMonths} months of solvency")
    elif (data.runwayMonths or 0) < 6:
        risk_factors.append(f"Critical Runway Alert: only {data.runwayMonths} months of cash remaining")

    if (data.cac or 0) > 0 and (data.ltv or 0) > 0:
        ratio = data.ltv / data.cac
        if ratio >= 3.0:
            key_drivers.append(f"Strong Unit Economics: LTV/CAC ratio of {ratio:.1f}x (>= 3.0 benchmark)")
        elif ratio < 1.0:
            risk_factors.append(f"Unhealthy Unit Economics: LTV/CAC ratio of {ratio:.1f}x (< 1.0 indicates customer loss)")

    if (data.annualRevenueGrowth or 0) >= 30:
        key_drivers.append(f"Rapid Traction: {data.annualRevenueGrowth:.0f}% YoY revenue growth")
    elif (data.annualRevenueGrowth or 0) < 0:
        risk_factors.append(f"Negative Revenue Trajectory: {data.annualRevenueGrowth:.0f}% revenue contraction")

    if (data.founder_exits or 0) > 0:
        key_drivers.append(f"Founder Track Record: Founding team has {data.founder_exits} prior successful exit(s)")

    if (data.debt or 0) > (data.cashBalance or 0):
        risk_factors.append("Debt Imbalance: Total liabilities exceed current cash reserves")

    if not key_drivers:
        key_drivers.append("Standard domain metrics alignment for current stage")

    return StartupEvaluationResponse(
        startup_id=data.startup_id,
        algorithm_used=algorithm_name,
        investment_potential_tier=tier,
        investment_potential_score=score,
        confidence_score=round(confidence, 4),
        probabilities=prob_dict,
        key_drivers=key_drivers,
        risk_factors=risk_factors
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("serve_api:app", host="0.0.0.0", port=8000, reload=False)
