# SafePay

SafePay is a production-grade AI-powered secure payment platform focused on fraud prevention, explainability, and privacy-preserving intelligence sharing.

## Repository Layout

- [frontend](frontend) - Next.js 14 App Router, TypeScript, Tailwind CSS, ShadCN UI
- [backend](backend) - FastAPI service for payments, auth, fraud orchestration, and platform APIs
- [ml-service](ml-service) - Fraud scoring service for XGBoost, Isolation Forest, and SHAP-based explanations
- [blockchain](blockchain) - Solidity contracts and Hardhat tooling for anonymized fraud intelligence
- [fl-service](fl-service) - Flower federated learning coordinator and simulated client orchestration
- [docs](docs) - Product, design, planning, and architecture docs
- [scripts](scripts) - Utility scripts for local development and maintenance

## Reference Docs

- [rules.md](rules.md)
- [Schema.md](Schema.md)
- [Tracker.md](Tracker.md)
- [ImplementationPlan.md](ImplimatationPlan.md)
