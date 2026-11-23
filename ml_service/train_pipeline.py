"""
Startup Investment Potential Prediction - Automated Model Training & Comparison Pipeline
Evaluates Random Forest, XGBoost, Logistic Regression, Decision Tree, and Support Vector Machine.
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any

from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.metrics import classification_report

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(CURRENT_DIR, "sample_dataset.csv")
MODEL_OUTPUT_PATH = os.path.join(CURRENT_DIR, "best_startup_classifier.joblib")

def build_preprocessor():
    numeric_features = [
        "annualRevenue", "monthlyRevenue", "annualRevenueGrowth",
        "netProfitLoss", "monthlyExpenses", "cashBalance", "monthlyBurnRate",
        "runwayMonths", "fundingGoal", "companyValuation", "totalFundingRaised",
        "debt", "cac", "ltv", "team_experience_years", "founder_exits", "market_size_tam"
    ]
    categorical_features = ["sector", "stage", "business_model"]

    num_transformer = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    cat_transformer = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    preprocessor = ColumnTransformer(transformers=[
        ("num", num_transformer, numeric_features),
        ("cat", cat_transformer, categorical_features)
    ])
    return preprocessor

def get_candidate_classifiers() -> Dict[str, Any]:
    return {
        "Random_Forest": RandomForestClassifier(
            n_estimators=150, max_depth=8, min_samples_split=3,
            class_weight="balanced", random_state=42
        ),
        "XGBoost": XGBClassifier(
            n_estimators=120, max_depth=4, learning_rate=0.08,
            eval_metric="mlogloss", random_state=42
        ),
        "Logistic_Regression": LogisticRegression(
            C=1.0, penalty="l2", solver="lbfgs", max_iter=1000,
            class_weight="balanced", random_state=42
        ),
        "Decision_Tree": DecisionTreeClassifier(
            max_depth=6, min_samples_split=4, class_weight="balanced", random_state=42
        ),
        "Support_Vector_Machine": SVC(
            C=1.5, kernel="rbf", probability=True, class_weight="balanced", random_state=42
        )
    }

def train_and_compare_models():
    print(f"Loading dataset from: {DATASET_PATH}")
    df = pd.read_csv(DATASET_PATH)

    # Encode target labels: LOW_POTENTIAL -> 0, MODERATE_POTENTIAL -> 1, HIGH_POTENTIAL -> 2
    label_mapping = {"LOW_POTENTIAL": 0, "MODERATE_POTENTIAL": 1, "HIGH_POTENTIAL": 2}
    inverse_mapping = {v: k for k, v in label_mapping.items()}
    y = df["target_investment_potential"].map(label_mapping)
    X = df.drop(columns=["target_investment_potential", "startup_id"], errors="ignore")

    preprocessor = build_preprocessor()
    classifiers = get_candidate_classifiers()

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scoring = {
        "accuracy": "accuracy",
        "precision": "precision_macro",
        "recall": "recall_macro",
        "f1": "f1_macro",
        "roc_auc": "roc_auc_ovr"
    }

    print("\n" + "=" * 80)
    print("  MODEL COMPARISON BENCHMARK (Stratified 5-Fold Cross-Validation)")
    print("=" * 80)
    print(f"{'Algorithm':<26} | {'Accuracy':<9} | {'Precision':<9} | {'Recall':<9} | {'F1-Score':<9} | {'ROC-AUC':<9}")
    print("-" * 80)

    best_model_name = None
    best_f1 = -1.0
    evaluation_summary = {}

    for name, clf in classifiers.items():
        pipeline = Pipeline([
            ("preprocessor", preprocessor),
            ("classifier", clf)
        ])

        scores = cross_validate(pipeline, X, y, cv=cv, scoring=scoring, n_jobs=1)
        acc = float(np.mean(scores["test_accuracy"]))
        prec = float(np.mean(scores["test_precision"]))
        rec = float(np.mean(scores["test_recall"]))
        f1 = float(np.mean(scores["test_f1"]))
        auc = float(np.mean(scores["test_roc_auc"]))

        evaluation_summary[name] = {"Accuracy": acc, "Precision": prec, "Recall": rec, "F1": f1, "ROC-AUC": auc}
        print(f"{name:<26} | {acc:.4f}    | {prec:.4f}    | {rec:.4f}    | {f1:.4f}    | {auc:.4f}")

        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name

    print("=" * 80)
    print(f"Top-Performing Algorithm: {best_model_name} (F1-Score: {best_f1:.4f})")
    print("=" * 80)

    # Fit final pipeline on 100% of available dataset
    winning_clf = classifiers[best_model_name]
    final_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", winning_clf)
    ])
    final_pipeline.fit(X, y)

    # Attach metadata for inference
    artifact = {
        "pipeline": final_pipeline,
        "algorithm_name": best_model_name,
        "label_mapping": label_mapping,
        "inverse_mapping": inverse_mapping,
        "evaluation_summary": evaluation_summary
    }

    joblib.dump(artifact, MODEL_OUTPUT_PATH)
    print(f"\nTrained model artifact successfully serialized to: {MODEL_OUTPUT_PATH}")
    return artifact

if __name__ == "__main__":
    train_and_compare_models()
