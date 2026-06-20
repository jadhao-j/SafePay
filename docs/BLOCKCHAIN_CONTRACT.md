# BLOCKCHAIN_CONTRACT.md — Interface Contract for Blockchain Layer (Mayur)

> This is the ONLY thing you need to honor. As long as your contracts expose these exact functions, you can change everything inside `blockchain/` freely — Solidity implementation, gas optimization, testing approach, anything. The backend team (Jay) will never touch your folder, and you never need to touch `backend/`.

---

## Your Folder

```
blockchain/
  contracts/            ← your .sol files go here
    FraudRegistry.sol
    Reputation.sol
  scripts/               ← deployment scripts
  test/                  ← your Hardhat tests
  hardhat.config.js     ← already exists, don't need to touch unless adding plugins
  package.json           ← already exists
  README.md              ← document your approach here for the thesis
```

## How To Run Standalone (you don't need full Docker stack for daily dev)

```bash
cd blockchain
npm install

# Terminal 1 — start local chain
npx hardhat node

# Terminal 2 — compile and test
npx hardhat compile
npx hardhat test
```

To test inside the full stack later: `docker compose up -d --build hardhat-node`

---

## What You're Building — 2 Smart Contracts

### Contract 1 — `FraudRegistry.sol`

**Purpose:** Banks publish anonymized fraud signals here. Other banks can check if a device/account/merchant hash has been flagged elsewhere — without ever seeing real customer data.

**Required functions — this is the contract:**

```solidity
// Report a fraud signal (called when a confirmed fraud case is closed)
function reportFraud(bytes32 entityHash, uint8 entityType) external;

// Check if a hash has been reported as fraud anywhere in the network
function checkSignal(bytes32 entityHash) external view returns (bool isFraud, uint256 reportedAt, address reportingBank);

// Get total number of fraud signals reported (for admin dashboard stats)
function getTotalSignals() external view returns (uint256);
```

**`entityType` values (matches `BlockchainEntityType` enum in our Postgres schema):**
```
0 = DEVICE
1 = MERCHANT
2 = ACCOUNT
```

**Critical privacy rule — non-negotiable:**
The backend will NEVER send you raw user IDs, device IDs, emails, or phone numbers. You will only ever receive `bytes32` hashes (keccak256 hashes computed by the backend before calling you). **Do not design any function that accepts or stores plaintext identifiers.** If a function signature in your implementation needs a string/address tied to a real person, that's a violation of the project's core privacy requirement — flag it to Jay immediately rather than building it.

**Events (for the admin dashboard to listen to in real-time):**
```solidity
event FraudReported(bytes32 indexed entityHash, uint8 entityType, address indexed reportingBank, uint256 timestamp);
```

---

### Contract 2 — `Reputation.sol`

**Purpose:** Track a rolling trust/risk score per entity hash, separate from the binary fraud flag — used for the "reputation_scores" table in our schema.

**Required functions:**

```solidity
// Update reputation score for an entity (0-100, where 100 = most trustworthy)
function updateReputation(bytes32 entityHash, uint8 newScore) external;

// Get current reputation score
function getReputation(bytes32 entityHash) external view returns (uint8 score, uint256 lastUpdated);
```

**Events:**
```solidity
event ReputationUpdated(bytes32 indexed entityHash, uint8 oldScore, uint8 newScore, uint256 timestamp);
```

---

## Access Control — Who Can Call These Functions

For the MVP/FYP scope, simulate 3 "bank" accounts (Hardhat gives you test accounts automatically). Only addresses on an allowlist should be able to call `reportFraud` and `updateReputation` — anyone can call the `view` functions (`checkSignal`, `getReputation`).

```solidity
mapping(address => bool) public authorizedBanks;

modifier onlyAuthorizedBank() {
    require(authorizedBanks[msg.sender], "Not an authorized bank");
    _;
}
```

Add a simple `addBank(address bank)` admin function (owner-only) so we can register the 3 simulated banks during deployment/testing.

---

## What The Backend Sends You — Web3.py Integration Point

Your contracts will be called by `backend/app/services/blockchain_service.py` (this file doesn't exist yet — it gets built in Phase 6 by Jay, using YOUR deployed contract address and ABI).

**The hash computation happens in the backend, like this** (so you know what format `bytes32` arrives in):
```python
from web3 import Web3
entity_hash = Web3.keccak(text=f"{entity_id}:{salt}")
```

You don't write this code — just know that `entityHash` is always a `keccak256` output, 32 bytes, already anonymized before it reaches your contract.

---

## What You Need To Hand Off To Jay

After deploying to the local Hardhat node, give Jay these 3 things:

1. **Contract addresses** (printed by your deploy script)
2. **ABI JSON files** — Hardhat auto-generates these in `artifacts/contracts/FraudRegistry.sol/FraudRegistry.json` (the `abi` field inside)
3. **A short README** in your `blockchain/README.md` explaining: how to redeploy, which Hardhat account is "Bank 1/2/3", and any gas considerations

---

## Deployment Script Expectation

Create `blockchain/scripts/deploy.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const [deployer, bank1, bank2, bank3] = await hre.ethers.getSigners();

  const FraudRegistry = await hre.ethers.getContractFactory("FraudRegistry");
  const fraudRegistry = await FraudRegistry.deploy();
  await fraudRegistry.waitForDeployment();
  console.log("FraudRegistry deployed to:", await fraudRegistry.getAddress());

  const Reputation = await hre.ethers.getContractFactory("Reputation");
  const reputation = await Reputation.deploy();
  await reputation.waitForDeployment();
  console.log("Reputation deployed to:", await reputation.getAddress());

  // Authorize the 3 simulated banks
  await fraudRegistry.addBank(bank1.address);
  await fraudRegistry.addBank(bank2.address);
  await fraudRegistry.addBank(bank3.address);

  console.log("Bank 1:", bank1.address);
  console.log("Bank 2:", bank2.address);
  console.log("Bank 3:", bank3.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

Run with:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

---

## Testing Requirement

Write Hardhat tests covering at minimum:

```javascript
describe("FraudRegistry", function () {
  it("should allow authorized bank to report fraud");
  it("should reject fraud report from unauthorized address");
  it("should return false for unreported hash");
  it("should return true and correct metadata for reported hash");
  it("should emit FraudReported event on report");
});

describe("Reputation", function () {
  it("should allow authorized bank to update reputation");
  it("should return correct score and timestamp");
  it("should emit ReputationUpdated event");
});
```

Run with: `npx hardhat test`

---

## What You're Building, Phase by Phase

| Phase | Your task |
|---|---|
| Phase 6 | Write both contracts above, deploy to local Hardhat, write tests, hand off ABI + addresses to Jay |
| Phase 8 (support) | If the admin dashboard needs live blockchain event streaming, help wire up event listeners (optional, can be Jay's job using your ABI) |

---

## What You DO NOT Need To Worry About

- Authentication — the backend is the only caller of your contracts
- Database — Postgres is irrelevant to your work, you only deal with on-chain state
- Real user data — you will never see emails, phone numbers, or transaction amounts. Only `bytes32` hashes
- Frontend — you never touch React/Next.js
- Mainnet/testnet costs — everything runs on local Hardhat node for this project, zero real gas costs

---

## Git Workflow

```bash
git checkout -b feature/blockchain-<short-description>
# example: feature/blockchain-fraud-registry

# ...do your work in blockchain/ only...

git add blockchain/
git commit -m "feat(blockchain): implement FraudRegistry contract with bank allowlist"
git push origin feature/blockchain-fraud-registry
```

Then open a Pull Request on GitHub targeting `main`. Jay will review and merge.

**Never commit directly to `main`.** Never edit files outside `blockchain/` without asking first.
