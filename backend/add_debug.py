content = open('app/services/fraud_service.py').read()
# Add debug prints around write_explanation call
old = '''    await write_explanation(
        db, fraud_score_row.id, shap_contributions, component_scores, confidence
    )'''
new = '''    print(f'[DEBUG] shap_contributions count: {len(shap_contributions)}')
    print(f'[DEBUG] fraud_score_row.id: {fraud_score_row.id}')
    await write_explanation(
        db, fraud_score_row.id, shap_contributions, component_scores, confidence
    )
    print('[DEBUG] write_explanation completed')'''
result = content.replace(old, new, 1)
open('app/services/fraud_service.py', 'w').write(result)
print('Debug added:', '[DEBUG]' in result)
