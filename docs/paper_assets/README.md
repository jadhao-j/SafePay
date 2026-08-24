# SafePay Research Paper Assets

## Regenerate the paper (figures + DOCX)

```powershell
cd c:\Users\HP\SafePay
py docs\generate_research_paper.py
```

Close `SafePay Research paper.docx` in Word first if you get a permission error.

## Ganesh — run ML evaluation (fills Tables II, III, Figs 4–6)

1. Place IEEE-CIS `train_transaction.csv` in `ml-service/data/`
2. Install deps: `pip install pandas scikit-learn xgboost matplotlib joblib`
3. Run:

```powershell
cd c:\Users\HP\SafePay\ml-service
py -m app.models.evaluate_models --data data/train_transaction.csv
```

4. Regenerate paper: `py docs\generate_research_paper.py`

Outputs:
- `ml_evaluation_results.json` — all metrics for the paper generator
- `fig4_confusion_matrix.png`, `fig5_roc_curves.png`, `fig6_pr_curves.png`

## Figures (auto-generated)

| File | Description |
|------|-------------|
| `fig1_architecture.png` | Main payment + fraud pipeline |
| `fig2_experimental_flow.png` | ML evaluation workflow |
| `fig3_supporting_layers.png` | Blockchain + FL supporting layers |
