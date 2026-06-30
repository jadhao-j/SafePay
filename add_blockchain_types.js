const fs = require("fs");
let content = fs.readFileSync("src/lib/fraud-api.ts", "utf8");

const old = `export interface FraudCase {
  case_id: string;
  transaction_id: string;
  status: "open" | "investigating" | "confirmed_fraud" | "dismissed" | "closed";
  notes: string | null;
}`;

const replacement = `export interface BlockchainPublishResult {
  entity_hash: string;
  tx_hash: string;
  block_number: number;
  status: string;
}

export interface FraudCase {
  case_id: string;
  transaction_id: string;
  status: "open" | "investigating" | "confirmed_fraud" | "dismissed" | "closed";
  notes: string | null;
  blockchain?: {
    device?: BlockchainPublishResult;
    account?: BlockchainPublishResult;
  };
}`;

if (!content.includes(old)) {
  console.log("ANCHOR NOT FOUND");
  process.exit(1);
}

content = content.replace(old, replacement);
fs.writeFileSync("src/lib/fraud-api.ts", content);
console.log("SUCCESS");
