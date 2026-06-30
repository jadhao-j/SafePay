content = open("src/lib/fraud-api.ts").read()

old_case_type = """export interface FraudCase {
  case_id: string;
  transaction_id: string;
  status: \"open\" | \"investigating\" | \"confirmed_fraud\" | \"dismissed\" | \"closed\";
  notes: string | null;
}"""
new_case_type = """export interface BlockchainPublishResult {
  entity_hash: string;
  tx_hash: string;
  block_number: number;
  status: string;
}

export interface FraudCase {
  case_id: string;
  transaction_id: string;
  status: \"open\" | \"investigating\" | \"confirmed_fraud\" | \"dismissed\" | \"closed\";
  notes: string | null;
  blockchain?: {
    device?: BlockchainPublishResult;
    account?: BlockchainPublishResult;
  };
}"""
assert old_case_type in content, "FraudCase type anchor not found"
content = content.replace(old_case_type, new_case_type)

open("src/lib/fraud-api.ts", "w").write(content)
print("SUCCESS:", "BlockchainPublishResult" in content)
