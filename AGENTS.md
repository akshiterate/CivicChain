# AGENTS.md — CivicChain Engineering Rules

This file tells every contributor (human or AI) how to work on CivicChain.
Follow it strictly. It exists so any student can explain any file in a viva.

## 1. Stack (do not change without reason)

- Solidity `^0.8.20` for the contract.
- Hardhat `2.x` with `hardhat.config.js` (CommonJS). Do NOT mix Hardhat 3 / ESM style.
- ethers.js `v6` for frontend + scripts.
- React + Vite for frontend.
- Hyperledger Caliper for benchmarks (ethereum connector, local Hardhat node).
- Sepolia testnet for public deployment.
- MetaMask for signing. No backend, no database — the contract is the source of truth.

## 2. Viva-first coding philosophy

- Simple, explicit, beginner-friendly code. A first-year student must be able to explain it.
- Descriptive names, ordinary `if/else`, loops, intermediate variables.
- One function = one job. Keep functions short.
- No clever one-liners, no unnecessary abstractions, no inheritance tricks, no extra patterns.
- No extra dependencies or config layers. No features outside `PROJECT_SPEC.md`.
- Comment only non-obvious security checks and blockchain behavior.
- Never sacrifice correctness/security for brevity.
- Read a file before editing it. Do not rewrite working code.

## 3. Security rules (mandatory)

- NEVER hardcode or commit private keys, mnemonics, RPC URLs, or `.env` contents.
- Secrets only via environment variables: `SEPOLIA_RPC_URL`, `PRIVATE_KEY`.
- Frontend `VITE_*` vars may only hold public data (contract address, chain id, RPC public endpoint). Never a private key.
- Authority check lives in the CONTRACT (`onlyAuthority`), never only in the frontend.
- Status may only move forward: Reported (0) -> In Progress (1) -> Resolved (2). Same-status or backwards = revert.
- Validate inputs: description non-empty, IDs in range.

## 4. Repo layout

```
contracts/CivicChain.sol   — the only smart contract
test/CivicChain.test.js    — Hardhat automated tests
scripts/deploy.js          — Sepolia/local deployment (uses env vars)
frontend/                  — React + Vite app (ethers v6)
caliper/                   — benchmark config + workload + results
docs/                      — architecture.md, testing.md, benchmarking.md, viva/
.env.example               — placeholder keys only, no real secrets
```

## 5. Commands (Windows native, no WSL required)

Use `npm.cmd` directly because `npm.ps1` is blocked by ExecutionPolicy:

```
& "C:\Program Files\nodejs\npm.cmd" install
& "C:\Program Files\nodejs\npx.cmd" hardhat compile
& "C:\Program Files\nodejs\npx.cmd" hardhat test
& "C:\Program Files\nodejs\npx.cmd" hardhat node
```

- Compile: `npx hardhat compile`
- Test: `npx hardhat test`
- Local node: `npx hardhat node`
- Deploy local: `npx hardhat run scripts/deploy.js --network localhost`
- Deploy Sepolia: `npx hardhat run scripts/deploy.js --network sepolia`
- Frontend dev: `npm run dev` (inside `frontend/`)
- Frontend build: `npm run build` (inside `frontend/`)

## 6. Documentation sync rule

- Every code change updates the matching doc: `README.md`, `docs/*.md`, `docs/viva/*`.
- Viva guides must describe the ACTUAL code, not idealized code.
- Never fabricate benchmark numbers or test results. Paste real output.
