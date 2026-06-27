content = open('app/services/wallet_service.py').read()

old_merchant = '    db.add(txn)\n    await db.flush()\n\n    await _write_audit_log(\n        db,\n        sender_user_id,\n        "payment.merchant_pay",\n        {"amount": str(amount), "merchant_id": str(merchant.id)},\n    )\n    await db.commit()\n    return txn  '

new_merchant = '    db.add(txn)\n    await db.flush()\n\n    behavioral_data = await _get_trust_score(db, sender_user_id)\n    fraud_result = await fraud_service.score_transaction(db, txn, device_id, behavioral_data["trust_score"])\n    if fraud_result["decision"] == "block":\n        await db.rollback()\n        raise ValueError(f"Transaction blocked. Risk score: {fraud_result[\"final_risk_score\"]:.2f}")\n\n    await _write_audit_log(\n        db,\n        sender_user_id,\n        "payment.merchant_pay",\n        {"amount": str(amount), "merchant_id": str(merchant.id), "fraud_decision": fraud_result["decision"]},\n    )\n    await db.commit()\n    return txn'

content = content.replace(old_merchant, new_merchant, 1)
open('app/services/wallet_service.py', 'w').write(content)
print('Total fraud scoring calls:', content.count('fraud_service.score_transaction'))
