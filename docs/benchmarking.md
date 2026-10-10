# Benchmarking (Hyperledger Caliper 0.5.0, ethereum connector)

## Setup

- Target: local Hardhat node (`ws://127.0.0.1:8545`), chainId 31337.
- Contract deployed fresh by `scripts/setupCaliper.js`, which embeds ABI +
  address into `caliper/networkConfig.json` (Caliper 0.5.0 cannot pass
  constructor args, so it attaches instead of deploying).
- Workloads send through `sutAdapter.sendRequests`, so every tx is counted.
  (An earlier ethers-direct version bypassed the adapter: thousands of txs were
  mined but counted as 0 and the round never ended. Rewritten; lesson kept.)
- One worker / one funded account: the connector tracks that account's nonce,
  so parallel workers would collide. Never run against Sepolia.
- Command per round set, e.g.:
  `npx caliper launch manager --caliper-workspace . --caliper-benchconfig benchmarkConfig.yaml --caliper-networkconfig networkConfig.json --caliper-flow-only-test`

## Actual results — 2026-10-10, full run, 39.1s, 3/3 rounds green

| Round         | Succ | Fail | Send rate (TPS) | Max lat (s) | Min lat (s) | Avg lat (s) | Throughput (TPS) |
|---------------|------|------|-----------------|-------------|-------------|-------------|------------------|
| submit-smoke  | 10   | 0    | 5.5             | 0.03        | 0.01        | 0.01        | 5.5              |
| submit-load   | 100  | 0    | 20.2            | 0.01        | 0.01        | 0.01        | 20.2             |
| status-update | 20   | 0    | 5.3             | 0.01        | 0.01        | 0.01        | 5.3              |

Chain state after: 110 complaints, 20 In Progress, 90 Reported — matches.
Raw log: `caliper/results/benchmark-full-2026-10-10.log`. HTML report:
`caliper/results/report-2026-10-10.html`.

## Resource usage

Caliper 0.5.0's default observer reports tx stats only (no per-round CPU/memory
percentiles on this setup). Environment: Windows 11, Node 24, Hardhat automine —
latencies (~0.01s) reflect instant local mining, NOT testnet performance. No
claims beyond that. The old `hardhat-node.log` and runaway-tx history come from
the debugging loop described above; benchmark figures are from the clean final run.

## How to reproduce

1. `npx hardhat node` (terminal 1). 2. `node scripts/setupCaliper.js`.
3. `cd caliper && npm install`. 4. Run smoke config, then full config as above.
