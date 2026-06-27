content = open('app/services/wallet_service.py').read()
content = content.replace(
    'raise ValueError(f"Transaction blocked. Risk score: {fraud_result["final_risk_score"]:.2f}")',
    'risk_score_val = fraud_result["final_risk_score"]\n        raise ValueError(f"Transaction blocked. Risk score: {risk_score_val:.2f}")'
)
print('Fixed:', content.count('risk_score_val'))
open('app/services/wallet_service.py', 'w').write(content)
