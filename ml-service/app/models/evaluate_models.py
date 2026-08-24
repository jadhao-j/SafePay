"""
SafePay ML evaluation — baselines, metrics, confusion matrix, ROC/PR curves.

Run from ml-service/ (requires train_transaction.csv and sklearn/xgboost/matplotlib):

    py -m app.models.evaluate_models --data data/train_transaction.csv

Outputs JSON + figures to docs/paper_assets/ for the research paper generator.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
    precision_recall_curve,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier

RANDOM_STATE = 42
TEST_SIZE = 0.2
MISSING_THRESHOLD = 0.80

REPO_ROOT = Path(__file__).resolve().parents[3]
ASSETS = REPO_ROOT / "docs" / "paper_assets"


def preprocess_train_test(df: pd.DataFrame):
    """Fit preprocessing on training split only — prevents data leakage."""
    missing_pct = df.isnull().mean()
    drop_cols = missing_pct[missing_pct > MISSING_THRESHOLD].index.tolist()
    df = df.drop(columns=drop_cols)

    X = df.drop("isFraud", axis=1)
    y = df["isFraud"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )

    cat_cols = X_train.select_dtypes(include=["object"]).columns.tolist()
    encoders = {}
    for col in cat_cols:
        le = LabelEncoder()
        le.fit(X_train[col].astype(str))
        encoders[col] = le
        X_train[col] = le.transform(X_train[col].astype(str))
        # unseen categories in test → 0
        X_test[col] = X_test[col].astype(str).map(
            lambda v: le.transform([v])[0] if v in le.classes_ else 0
        )

    X_train = X_train.fillna(0)
    X_test = X_test.fillna(0)

    meta = {
        "rows_total": len(df),
        "features_after_drop": X.shape[1],
        "dropped_columns": len(drop_cols),
        "train_rows": len(X_train),
        "test_rows": len(X_test),
        "fraud_rate_train": float(y_train.mean()),
        "fraud_rate_test": float(y_test.mean()),
    }
    return X_train, X_test, y_train, y_test, encoders, meta


def compute_metrics(y_test, y_pred, y_prob) -> dict:
    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
    return {
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 6),
        "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 6),
        "recall": round(float(recall_score(y_test, y_pred, zero_division=0)), 6),
        "f1": round(float(f1_score(y_test, y_pred, zero_division=0)), 6),
        "roc_auc": round(float(roc_auc_score(y_test, y_prob)), 6),
        "pr_auc": round(float(average_precision_score(y_test, y_prob)), 6),
        "fpr": round(float(fp / (fp + tn)) if (fp + tn) else 0.0, 6),
        "fnr": round(float(fn / (fn + tp)) if (fn + tp) else 0.0, 6),
        "tp": int(tp),
        "tn": int(tn),
        "fp": int(fp),
        "fn": int(fn),
    }


def train_and_eval(name: str, model, X_train, X_test, y_train, y_test) -> dict:
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    if hasattr(model, "predict_proba"):
        y_prob = model.predict_proba(X_test)[:, 1]
    else:
        y_prob = model.decision_function(X_test)
        y_prob = (y_prob - y_prob.min()) / (y_prob.max() - y_prob.min() + 1e-9)

    metrics = compute_metrics(y_test, y_pred, y_prob)
    metrics["model"] = name
    return metrics, y_prob


def plot_confusion_matrix(y_test, y_pred, out_path: Path):
    cm = confusion_matrix(y_test, y_pred)
    fig, ax = plt.subplots(figsize=(5, 4))
    im = ax.imshow(cm, cmap="Blues")
    ax.set_xticks([0, 1])
    ax.set_yticks([0, 1])
    ax.set_xticklabels(["Genuine", "Fraud"])
    ax.set_yticklabels(["Genuine", "Fraud"])
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    for i in range(2):
        for j in range(2):
            ax.text(j, i, cm[i, j], ha="center", va="center", color="black", fontsize=14)
    ax.set_title("XGBoost Confusion Matrix (Test Set)")
    fig.colorbar(im, ax=ax, fraction=0.046)
    fig.savefig(out_path, dpi=200, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def plot_roc_curves(curves: dict, out_path: Path):
    fig, ax = plt.subplots(figsize=(6, 5))
    for name, (y_test, y_prob) in curves.items():
        fpr, tpr, _ = roc_curve(y_test, y_prob)
        auc = roc_auc_score(y_test, y_prob)
        ax.plot(fpr, tpr, label=f"{name} (AUC={auc:.3f})")
    ax.plot([0, 1], [0, 1], "k--", alpha=0.4)
    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.set_title("ROC Curves — Model Comparison")
    ax.legend(fontsize=8)
    fig.savefig(out_path, dpi=200, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def plot_pr_curves(curves: dict, out_path: Path):
    fig, ax = plt.subplots(figsize=(6, 5))
    for name, (y_test, y_prob) in curves.items():
        prec, rec, _ = precision_recall_curve(y_test, y_prob)
        ap = average_precision_score(y_test, y_prob)
        ax.plot(rec, prec, label=f"{name} (AP={ap:.3f})")
    ax.set_xlabel("Recall")
    ax.set_ylabel("Precision")
    ax.set_title("Precision-Recall Curves — Model Comparison")
    ax.legend(fontsize=8)
    fig.savefig(out_path, dpi=200, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def pct(x: float) -> str:
    return f"{x * 100:.2f}%"


def main():
    parser = argparse.ArgumentParser(description="Evaluate SafePay fraud detection models")
    parser.add_argument(
        "--data",
        default="data/train_transaction.csv",
        help="Path to IEEE-CIS train_transaction.csv",
    )
    args = parser.parse_args()
    data_path = Path(args.data)
    if not data_path.exists():
        raise SystemExit(
            f"Dataset not found: {data_path}\n"
            "Place IEEE-CIS train_transaction.csv in ml-service/data/ and re-run."
        )

    ASSETS.mkdir(parents=True, exist_ok=True)
    print(f"Loading {data_path} ...")
    df = pd.read_csv(data_path)

    X_train, X_test, y_train, y_test, encoders, meta = preprocess_train_test(df)
    print(f"Train: {meta['train_rows']:,} | Test: {meta['test_rows']:,} | Features: {meta['features_after_drop']}")

    models = {
        "Logistic Regression": Pipeline(
            [
                ("imputer", SimpleImputer(strategy="constant", fill_value=0)),
                ("scaler", StandardScaler()),
                (
                    "clf",
                    LogisticRegression(max_iter=1000, random_state=RANDOM_STATE, class_weight="balanced"),
                ),
            ]
        ),
        "Decision Tree": DecisionTreeClassifier(
            max_depth=12, random_state=RANDOM_STATE, class_weight="balanced"
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=100, max_depth=12, random_state=RANDOM_STATE, class_weight="balanced", n_jobs=-1
        ),
        "XGBoost": XGBClassifier(
            n_estimators=50,
            max_depth=6,
            learning_rate=0.1,
            random_state=RANDOM_STATE,
            eval_metric="logloss",
            scale_pos_weight=(y_train == 0).sum() / max((y_train == 1).sum(), 1),
        ),
    }

    results = []
    curves = {}
    xgb_pred = None

    for name, model in models.items():
        print(f"Training {name} ...")
        metrics, y_prob = train_and_eval(name, model, X_train, X_test, y_train, y_test)
        results.append(metrics)
        curves[name] = (y_test, y_prob)
        print(f"  F1={metrics['f1']:.4f}  ROC-AUC={metrics['roc_auc']:.4f}  Recall={metrics['recall']:.4f}")
        if name == "XGBoost":
            xgb_pred = (metrics, model.predict(X_test))

    xgb_metrics, y_pred = xgb_pred
    plot_confusion_matrix(y_test, y_pred, ASSETS / "fig4_confusion_matrix.png")
    plot_roc_curves(curves, ASSETS / "fig5_roc_curves.png")
    plot_pr_curves(curves, ASSETS / "fig6_pr_curves.png")

    payload = {
        "dataset": str(data_path),
        "preprocessing": meta,
        "data_leakage_controls": [
            "Columns with >80% missing removed before split",
            "LabelEncoders fit on training split only",
            "Imputer/scaler (LR pipeline) fit on training split only",
            "No SMOTE applied in this evaluation script",
            "Test labels never used during training or feature selection",
        ],
        "models": results,
        "classification_report_xgboost": classification_report(y_test, y_pred, digits=4),
    }

    out_json = ASSETS / "ml_evaluation_results.json"
    out_json.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"\nSaved metrics: {out_json}")
    print(f"Saved figures: {ASSETS}/fig4_confusion_matrix.png, fig5_roc_curves.png, fig6_pr_curves.png")
    print("\nRe-run: py docs/generate_research_paper.py")


if __name__ == "__main__":
    main()
