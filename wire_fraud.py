import re

content = open('app/services/wallet_service.py').read()

# Add fraud_service import after existing imports
old_import = 'from app.models.payments import Merchant, Transaction, Wallet'
new_import = '''from app.models.payments import Merchant, Transaction, Wallet
from app.services import fraud_service
from app.services.behavior_service import get_trust_score'''

content = content.replace(old_import, new_import)

# Wire fraud scoring into transfer_p2p - replace the commit block
old_p2p_commit = '''    db.add(txn)
    await db.flush()

    await _write_audit_log(
        db,
        sender_user_id,
        'payment.p2p_transfer',
        {'amount': str(amount), 'receiver_user_id': str(receiver_user.id)},
    )
    await db.commit()
    return txn'''

new_p2p_commit = '''    db.add(txn)
    await db.flush()

    # Fraud scoring before commit
    behavioral_data = await get_trust_score(db, sender_user_id)
    fraud_result = await fraud_service.score_transaction(
        db, txn, device_id, behavioral_data['trust_score']
    )
    if fraud_result['decision'] == 'block':
        await db.rollback()
        raise ValueError(f"Transaction blocked by fraud detection. Risk score: {fraud_result['final_risk_score']:.2f}")

    await _write_audit_log(
        db,
        sender_user_id,
        'payment.p2p_transfer',
        {'amount': str(amount), 'receiver_user_id': str(receiver_user.id), 'fraud_decision': fraud_result['decision']},
    )
    await db.commit()
    txn.fraud_decision = fraud_result['decision']
    return txn'''

content = content.replace(old_p2p_commit, new_p2p_commit)

# Wire fraud scoring into pay_merchant
old_merchant_commit = '''    db.add(txn)
    await db.flush()

    await _write_audit_log(
        db,
        sender_user_id,
        'payment.merchant_pay',
        {'amount': str(amount), 'merchant_id': str(merchant.id)},
    )
    await db.commit()
    return txn'''

new_merchant_commit = '''    db.add(txn)
    await db.flush()

    # Fraud scoring before commit
    behavioral_data = await get_trust_score(db, sender_user_id)
    fraud_result = await fraud_service.score_transaction(
        db, txn, device_id, behavioral_data['trust_score']
    )
    if fraud_result['decision'] == 'block':
        await db.rollback()
        raise ValueError(f"Transaction blocked by fraud detection. Risk score: {fraud_result['final_risk_score']:.2f}")

    await _write_audit_log(
        db,
        sender_user_id,
        'payment.merchant_pay',
        {'amount': str(amount), 'merchant_id': str(merchant.id), 'fraud_decision': fraud_result['decision']},
    )
    await db.commit()
    txn.fraud_decision = fraud_result['decision']
    return txn'''

content = content.replace(old_merchant_commit, new_merchant_commit)

open('app/services/wallet_service.py', 'w').write(content)

# Verify
p2p_count = content.count('fraud_service.score_transaction')
print(f'Fraud scoring wired into {p2p_count} payment functions')
print('Imports added:', 'fraud_service' in content)
