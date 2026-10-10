# Sepolia deployment

## Status (2026-10-10): NOT yet deployed — credentials unavailable

No `SEPOLIA_RPC_URL` / `PRIVATE_KEY` were provided in this environment, and the
rules forbid hardcoding or inventing them. Everything deployable was prepared
and verified locally instead.

## What is ready

- `scripts/deploy.js` reads `PRIVATE_KEY`, `SEPOLIA_RPC_URL`, optional
  `AUTHORITY_ADDRESS` from `.env`. Deployer becomes authority by default.
- `hardhat.config.js` has the `sepolia` network (chainId 11155111).
- Frontend reads `VITE_CONTRACT_ADDRESS` / `VITE_CHAIN_ID=11155111` / public
  `VITE_RPC_URL` — no secrets in frontend vars.

## Exact remaining steps (owner, ~15 min + faucet wait)

1. Get Sepolia ETH from a faucet (e.g. Google Cloud or Alchemy faucet) for the
   deployer/authority address.
2. Get an RPC endpoint (Infura/Alchemy public Sepolia endpoint).
3. In repo root: copy `.env.example` to `.env`, fill `SEPOLIA_RPC_URL`,
   `PRIVATE_KEY` (0x-prefixed), optional `AUTHORITY_ADDRESS`.
4. `npx hardhat run scripts/deploy.js --network sepolia` — prints address + tx hash.
5. Verify the lifecycle on Sepolia: submit (citizen) → advance → resolve
   (authority) → check `getComplaint` + events, e.g. via the frontend pointed at
   the new address or `npx hardhat console --network sepolia`.
6. Record here: contract address, deployment tx hash, block, authority address.
7. Optional: verify source on Sepolia Etherscan
   (`npx hardhat verify --network sepolia <address> <authority>` needs
   `@nomicfoundation/hardhat-verify` + Etherscan key — not installed, by design
   minimal; add only if the professor asks).

## Deployed record

| Item | Value |
|------|-------|
| Contract address | _pending_ |
| Deployment tx | _pending_ |
| Authority | _pending_ |
| Lifecycle verified on Sepolia | _pending_ |
