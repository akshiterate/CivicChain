# [Deployment](chain.akshitsac.workers.dev)
# CivicChain — Decentralized Civic Complaints

Citizens report potholes, broken streetlights, garbage overflow. The municipal
authority advances statuses. Anyone can read and verify. The Solidity contract
is the source of truth — no backend, no database.

## Stack

Solidity ^0.8.20 · Hardhat 2.29.1 (CommonJS config) · ethers v6 · React + Vite ·
MetaMask · Hyperledger Caliper 0.5.0 · Sepolia testnet

## Quick start (Windows, no WSL)

npm ships as `npm.cmd` here because `npm.ps1` is blocked by ExecutionPolicy.
Use `& "C:\Program Files\nodejs\npm.cmd"` for every npm command.

```powershell
# 1. Install root deps (Hardhat, tests)
& "C:\Program Files\nodejs\npm.cmd" install
# 2. Compile + test
& "C:\Program Files\nodejs\npx.cmd" hardhat compile
& "C:\Program Files\nodejs\npx.cmd" hardhat test
# 3. Full local lifecycle demo
& "C:\Program Files\nodejs\npx.cmd" hardhat run scripts/lifecycle.js
```

### Local dev network + frontend

```powershell
# Terminal 1: local chain (chainId 31337)
& "C:\Program Files\nodejs\npx.cmd" hardhat node
# Terminal 2: deploy, note the address
& "C:\Program Files\nodejs\npx.cmd" hardhat run scripts/deploy.js --network localhost
# Terminal 3: frontend
cd frontend
& "C:\Program Files\nodejs\npm.cmd" install
# copy .env.example to .env, set VITE_CONTRACT_ADDRESS to the deployed address
& "C:\Program Files\nodejs\npm.cmd" run dev
# open http://localhost:5173, connect MetaMask to localhost:8545
```

Import a Hardhat test account into MetaMask for the demo (local only, well-known
keys printed by `hardhat node`). Account #0 is a good authority; any account can
be a citizen.

### Benchmark (local only, never Sepolia)

```powershell
& "C:\Program Files\nodejs\npx.cmd" hardhat node        # terminal 1
node scripts/setupCaliper.js                            # deploy + write caliper config
cd caliper
& "C:\Program Files\nodejs\npm.cmd" install
& "C:\Program Files\nodejs\npx.cmd" caliper launch manager --caliper-workspace . --caliper-benchconfig smokeConfig.yaml --caliper-networkconfig networkConfig.json --caliper-flow-only-test
& "C:\Program Files\nodejs\npx.cmd" caliper launch manager --caliper-workspace . --caliper-benchconfig benchmarkConfig.yaml --caliper-networkconfig networkConfig.json --caliper-flow-only-test
```

Results: `docs/benchmarking.md`, raw logs: `caliper/results/`.

### Sepolia deployment

Secrets via `.env` only (see `.env.example`). Never commit `.env`.

```powershell
Copy-Item .env.example .env   # then fill SEPOLIA_RPC_URL + PRIVATE_KEY
& "C:\Program Files\nodejs\npx.cmd" hardhat run scripts/deploy.js --network sepolia
```

Record the printed address + tx hash in `docs/sepolia.md`. Full steps and
blockers: `docs/sepolia.md`. Website hosting steps: `docs/website.md`.

## Layout

```
contracts/CivicChain.sol  test/CivicChain.test.js  scripts/deploy.js
scripts/lifecycle.js  scripts/setupCaliper.js  frontend/  caliper/  docs/
```

## Docs

- `PROJECT_SPEC.md` — requirements + data model
- `AGENTS.md` — engineering rules
- `docs/architecture.md` — data flow
- `docs/testing.md` — real test output
- `docs/benchmarking.md` — real benchmark numbers
- `docs/sepolia.md` — testnet status + instructions
- `docs/website.md` — hosting instructions
- `docs/viva/` — explain-any-file guides
