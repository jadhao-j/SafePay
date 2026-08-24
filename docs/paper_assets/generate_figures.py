"""Generate SafePay research paper figures (PNG)."""

from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

ASSETS = Path(__file__).resolve().parent


def _box(ax, x, y, w, h, text, fc="#E8F4FD", ec="#1a5276", fontsize=9, bold=False):
    patch = FancyBboxPatch(
        (x - w / 2, y - h / 2),
        w,
        h,
        boxstyle="round,pad=0.02,rounding_size=0.08",
        linewidth=1.5,
        edgecolor=ec,
        facecolor=fc,
    )
    ax.add_patch(patch)
    weight = "bold" if bold else "normal"
    ax.text(x, y, text, ha="center", va="center", fontsize=fontsize, weight=weight, wrap=True)


def _arrow(ax, x1, y1, x2, y2):
    ax.add_patch(
        FancyArrowPatch(
            (x1, y1),
            (x2, y2),
            arrowstyle="-|>",
            mutation_scale=12,
            linewidth=1.4,
            color="#2c3e50",
            shrinkA=4,
            shrinkB=4,
        )
    )


def fig1_architecture():
    """Figure 1 — SafePay real-time fraud detection pipeline."""
    fig, ax = plt.subplots(figsize=(7.5, 11))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 22)
    ax.axis("off")

    cx = 5.0
    y = 21.0
    _box(ax, cx, y, 2.2, 0.7, "USER", fc="#D5F5E3", bold=True)
    y -= 1.0
    _arrow(ax, cx, y + 0.65, cx, y + 0.35)

    y -= 0.9
    _box(
        ax,
        cx,
        y,
        5.2,
        1.6,
        "Behavioural Signals\nKeystroke / Touch\nDevice Fingerprint",
        fc="#EBF5FB",
    )
    y -= 1.3
    _arrow(ax, cx, y + 0.55, cx, y + 0.25)

    y -= 0.7
    _box(ax, cx, y, 3.4, 0.65, "Payment Request", fc="#FEF9E7")
    y -= 0.95
    _arrow(ax, cx, y + 0.48, cx, y + 0.18)

    y -= 1.5
    _box(
        ax,
        cx,
        y,
        5.4,
        2.4,
        "Fraud Engine\n\nBehavioural Risk (35%)\nTransaction Risk (30%)\nDevice Risk (20%)\nML Risk (15%)",
        fc="#FDEDEC",
        ec="#922b21",
    )
    y -= 1.6
    _arrow(ax, cx, y + 0.45, cx, y + 0.15)

    y -= 0.65
    _box(ax, cx, y, 3.6, 0.65, "Composite Score", fc="#F4ECF7", bold=True)
    y -= 1.0
    _arrow(ax, cx, y + 0.48, cx, y + 0.18)

    # Decision branches
    y -= 0.55
    for dx, label, color in [(-2.4, "APPROVE", "#D5F5E3"), (0, "CHALLENGE", "#FCF3CF"), (2.4, "BLOCK", "#FADBD8")]:
        _arrow(ax, cx, y + 0.35, cx + dx, y - 0.15)
        _box(ax, cx + dx, y - 0.55, 2.0, 0.6, label, fc=color, fontsize=8, bold=True)

    y -= 1.5
    _arrow(ax, cx, y + 0.35, cx, y + 0.05)
    _box(ax, cx, y - 0.35, 3.8, 0.65, "SHAP Explanation", fc="#E8DAEF")
    y -= 1.0
    _arrow(ax, cx, y + 0.18, cx, y - 0.12)
    _box(ax, cx, y - 0.55, 3.2, 0.65, "User / SOC Dashboard", fc="#D6EAF8", bold=True)

    ax.text(
        5,
        0.4,
        "Fig. 1. SafePay real-time fraud detection pipeline (main payment path).",
        ha="center",
        fontsize=10,
        style="italic",
    )
    out = ASSETS / "fig1_architecture.png"
    fig.savefig(out, dpi=200, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    return out


def fig2_experimental_flow():
    """Figure 2 — Offline ML evaluation workflow."""
    fig, ax = plt.subplots(figsize=(8, 10))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 16)
    ax.axis("off")

    cx = 5.0
    steps = [
        "IEEE-CIS Dataset\n(590,540 transactions)",
        "Data Cleaning\n(>80% missing cols removed)",
        "Feature Processing\n(LabelEncoder, 338 features)",
        "Train / Test Split\n(80/20, stratified)",
    ]
    y = 15.0
    prev_y = None
    for step in steps:
        _box(ax, cx, y, 4.8, 0.9, step, fc="#EBF5FB")
        if prev_y is not None:
            _arrow(ax, cx, prev_y - 0.55, cx, y + 0.55)
        prev_y = y
        y -= 1.5

    # Branch baselines vs xgboost
    y -= 0.3
    _arrow(ax, cx, prev_y - 0.55, cx, y + 0.55)
    _box(ax, cx, y, 4.2, 0.7, "Model Training", fc="#FEF9E7", bold=True)
    y -= 1.2
    _arrow(ax, cx, y + 0.95, 2.5, y + 0.35)
    _arrow(ax, cx, y + 0.95, 7.5, y + 0.35)
    _box(ax, 2.5, y, 3.2, 1.0, "Baselines\nLR · DT · RF", fc="#FDEBD0", fontsize=8)
    _box(ax, 7.5, y, 2.8, 1.0, "XGBoost\n(SafePay)", fc="#D5F5E3", fontsize=8, bold=True)
    y -= 1.3
    _arrow(ax, 2.5, y + 0.65, cx, y + 0.15)
    _arrow(ax, 7.5, y + 0.65, cx, y + 0.15)

    rest = [
        "Performance Evaluation",
        "Precision · Recall · F1\nROC-AUC · PR-AUC · FPR · FNR",
        "Comparative Analysis\n(Table II, confusion matrix, ROC/PR curves)",
        "SafePay Live Integration\n(/score + weighted pipeline)",
    ]
    for step in rest:
        _box(ax, cx, y, 5.0, 0.9 if "\n" in step else 0.7, step, fc="#F4ECF7")
        y -= 1.3
        _arrow(ax, cx, y + 1.0, cx, y + 0.55)

    ax.text(
        5,
        0.35,
        "Fig. 2. Offline ML evaluation workflow (preprocessing fitted on training split only).",
        ha="center",
        fontsize=10,
        style="italic",
    )
    out = ASSETS / "fig2_experimental_flow.png"
    fig.savefig(out, dpi=200, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    return out


def fig3_supporting_layers():
    """Figure 3 — Blockchain and federated learning supporting layers."""
    fig, ax = plt.subplots(figsize=(8, 6))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8)
    ax.axis("off")

    # Main pipeline (simplified)
    _box(ax, 5, 7.0, 4.5, 0.7, "Main Payment + Fraud Pipeline (Fig. 1)", fc="#D6EAF8", bold=True)
    _arrow(ax, 5, 6.55, 5, 6.15)

    # Blockchain layer
    _box(
        ax,
        2.5,
        4.8,
        4.0,
        2.2,
        "Blockchain Fraud Intelligence\n(Hardhat testnet)\n\n• keccak256(entity + salt)\n• FraudRegistry / Reputation\n• Cross-bank signal lookup\n• Zero raw PII on chain",
        fc="#FCF3CF",
        ec="#b7950b",
        fontsize=8,
    )
    # FL layer
    _box(
        ax,
        7.5,
        4.8,
        4.0,
        2.2,
        "Federated Learning\n(Flower FedXgbBagging)\n\n• 3 simulated bank clients\n• Local shards only\n• Aggregated global model\n• Metrics only exchanged",
        fc="#D5F5E3",
        ec="#1e8449",
        fontsize=8,
    )

    _arrow(ax, 5, 5.85, 2.5, 5.95)
    _arrow(ax, 5, 5.85, 7.5, 5.95)

    _box(ax, 5, 2.5, 5.5, 0.8, "Supporting layers — not on every payment hot path", fc="#F2F3F4", fontsize=9)

    ax.text(
        5,
        0.5,
        "Fig. 3. Privacy-preserving supporting layers: blockchain intelligence and federated learning.",
        ha="center",
        fontsize=10,
        style="italic",
    )
    out = ASSETS / "fig3_supporting_layers.png"
    fig.savefig(out, dpi=200, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    return out


def main():
    paths = [fig1_architecture(), fig2_experimental_flow(), fig3_supporting_layers()]
    for p in paths:
        print(f"Generated: {p}")


if __name__ == "__main__":
    main()
