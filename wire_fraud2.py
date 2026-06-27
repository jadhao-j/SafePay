content = open('app/services/wallet_service.py').read()

# Add imports
old_import = 'from app.models.payments import Merchant, Transaction, Wallet'
new_import = 'from app.models.payments import Merchant, Transaction, Wallet\nfrom app.services import fraud_service\nfrom app.services.behavior_service import get_trust_score as _get_trust_score'
content = content.replace(old_import, new_import, 1)

# Wire fraud into transfer_p2p
old_p2p = '    db.add(txn)\n    await db.flush()\n\n    await _write_audit_log(\n        db,\n        sender_user_id,\n        "payment.p2p_transfer",\n        {"amount": str(amount), "receiver_user_id": str(receiver_user.id)},\n    )\n    await db.commit()\n    return txn'

new_p2p = '    db.add(txn)\n    await db.flush()\n\n    behavioral_data = await _get_trust_score(db, sender_user_id)\n    fraud_result = await fraud_service.score_transaction(db, txn, device_id, behavioral_data["trust_score"])\n    if fraud_result["decision"] == "block":\n        await db.rollback()\n        raise ValueError(f"Transaction blocked. Risk score: {fraud_result[\"final_risk_score\"]:.2f}")\n\n    await _write_audit_log(\n        db,\n        sender_user_id,\n        "payment.p2p_transfer",\n        {"amount": str(amount), "receiver_user_id": str(receiver_user.id), "fraud_decision": fraud_result["decision"]},\n    )\n    await db.commit()\n    return txn'

content = content.replace(old_p2p, new_p2p, 1)

# Check merchant pay block
idx = content.find('"payment.merchant_pay"')
print('merchant_pay context:')
print(repr(content[idx-200:idx+200]))

open('app/services/wallet_service.py', 'w').write(content)
print('P2P wired:', content.count('fraud_service.score_transaction'))
