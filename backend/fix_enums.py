content = open('app/models/fraud.py').read()
content = content.replace(
    'Enum(FraudDecision, name="fraud_decision", create_type=False)',
    'Enum(FraudDecision, name="fraud_decision", create_type=False, values_callable=lambda e: [x.value for x in e])'
)
content = content.replace(
    'Enum(FraudCaseStatus, name="fraud_case_status", create_type=False)',
    'Enum(FraudCaseStatus, name="fraud_case_status", create_type=False, values_callable=lambda e: [x.value for x in e])'
)
content = content.replace(
    'Enum(AlertType, name="alert_type", create_type=False)',
    'Enum(AlertType, name="alert_type", create_type=False, values_callable=lambda e: [x.value for x in e])'
)
open('app/models/fraud.py', 'w').write(content)
print('Fixed:', content.count('values_callable'), 'occurrences')
