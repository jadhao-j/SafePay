content = open("docker-compose.yml").read()
old = "      BLOCKCHAIN_RPC_URL: ${BLOCKCHAIN_RPC_URL:-http://hardhat-node:8545}"
new = old + "\n      FRAUD_REGISTRY_ADDRESS: \"0x5FbDB2315678afecb367f032d93F642f64180aa3\"\n      REPUTATION_ADDRESS: \"0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512\"\n      BLOCKCHAIN_BANK_PRIVATE_KEY: \"0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d\"\n      BLOCKCHAIN_HASH_SALT: \"safepay-salt-v1\""
count = content.count(old)
print("occurrences:", count)
if count == 1:
    content = content.replace(old, new)
    open("docker-compose.yml", "w").write(content)
    print("SUCCESS")
else:
    print("ABORTED - not unique")
