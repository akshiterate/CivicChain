# Benchmarking (Hyperledger Caliper 0.5.0, ethereum connector)

## Setup

- Target: local Hardhat node (`ws://127.0.0.1:8545`), chainId 31337.
- Contract deployed fresh by `scripts/setupCaliper.js`, which embeds ABI +
  address into `caliper/networkConfig.json` (Caliper 0.5.0 cannot pass
  constructor args, so it attaches instead of deploying).
- **Re-run `setupCaliper.js` after every node restart.** A new chain has no code
  at the old address, so Caliper would report every transaction as failed.
- Workloads send through `sutAdapter.sendRequests`, so every tx is counted.
  (An earlier ethers-direct version bypassed the adapter: thousands of txs were
  mined but counted as 0 and the round never ended. Rewritten; lesson kept.)
- One worker / one funded account: the connector tracks that account's nonce,
  so parallel workers would collide. Never run against Sepolia.
- Run from inside `caliper/`: the benchmark config path resolves from the
  current directory, the network config path from the workspace.

## Commands

```powershell
# terminal 1
npx hardhat node

# terminal 2, repo root
node scripts/setupCaliper.js

# terminal 2, caliper/
npm run bench:smoke     # 5 tx wiring check (smokeConfig.yaml)
npm run bench           # full run (benchmarkConfig.yaml), 3 rounds

# turn the log into tables + charts in the same folder
node makeReport.js results/2026-10-26/benchmark-full.log results/2026-10-26
```

`npm run bench` expands to:

```
caliper launch manager --caliper-workspace . --caliper-benchconfig benchmarkConfig.yaml
       --caliper-networkconfig networkConfig.json --caliper-flow-only-test
```

The flag is `--caliper-networkconfig` (Caliper's config key is
`caliper-networkconfig`). An earlier `--caliper-network` typo made the manager
exit immediately with `Network configuration file path is not set` — no chain
contact, no report written. Fixed in `caliper/package.json`.

## Results folder

One folder per run, so earlier evidence is never overwritten:

```
caliper/results/2026-10-10/   # first run
  benchmark-full.log          Caliper console log (full config)
  benchmark-smoke.log         Caliper console log (smoke config)
  report.html                 Caliper's own HTML report, untouched
  charts.html                 generated: tables + SVG bar charts
  report.md                   generated: same tables as markdown
  results.csv                 generated: raw numbers for Excel/Sheets
caliper/results/2026-10-26/   # rerun, same layout + *.err.log stderr captures
```

`makeReport.js` parses Caliper's own `### All test results ###` table out of the
log and writes the three generated files. Charts are hand-written inline SVG
(`<rect>` bars on a pixel grid) — no charting library, no new dependency. If the
log has no results table, the script fails instead of inventing numbers.

## Actual results — 2026-10-26, full run, 39.1s, 3/3 rounds green

Contract `0x5FbDB2315678afecb367f032d93F642f64180aa3`, fresh chain.

| Round         | Succ | Fail | Send rate (TPS) | Max lat (s) | Min lat (s) | Avg lat (s) | Throughput (TPS) |
|---------------|------|------|-----------------|-------------|-------------|-------------|------------------|
| submit-smoke  | 10   | 0    | 5.5             | 0.06        | 0.01        | 0.02        | 5.5              |
| submit-load   | 100  | 0    | 20.2            | 0.02        | 0.01        | 0.01        | 20.2             |
| status-update | 20   | 0    | 5.3             | 0.05        | 0.01        | 0.01        | 5.2              |

Smoke-only run before it: `submit-smoke` 5 succ / 0 fail @ 2.5 TPS, 8.24 s.

Chain state after both runs, read back over RPC: **115 complaints total**
(5 smoke + 10 + 100), **20 In Progress**, **95 Reported**, **0 Resolved** —
matches the rounds exactly (130 submitted txs + 20 of them updated).

Files: `caliper/results/2026-10-26/` (`benchmark-full.log`, `report.html`,
`charts.html`, `report.md`, `results.csv`).

## Previous results — 2026-10-10, full run, 39.1s, 3/3 rounds green

Kept for comparison; same config, different day.

| Round         | Succ | Fail | Send rate (TPS) | Max lat (s) | Min lat (s) | Avg lat (s) | Throughput (TPS) |
|---------------|------|------|-----------------|-------------|-------------|-------------|------------------|
| submit-smoke  | 10   | 0    | 5.5             | 0.03        | 0.01        | 0.01        | 5.5              |
| submit-load   | 100  | 0    | 20.2            | 0.01        | 0.01        | 0.01        | 20.2             |
| status-update | 20   | 0    | 5.3             | 0.01        | 0.01        | 0.01        | 5.3              |

Chain state after: 110 complaints, 20 In Progress, 90 Reported. Files:
`caliper/results/2026-10-10/`.

Reproducibility: identical success counts, identical send rates, identical
throughput to within 0.1 TPS. Only max latency moved (0.03 -> 0.06 s), which is
millisecond noise on a local automine chain.

## Resource usage

Caliper 0.5.0's default observer reports tx stats only (no per-round CPU/memory
percentiles on this setup). Environment: Windows 11, Node 24, Hardhat automine —
latencies (~0.01s) reflect instant local mining, NOT testnet performance. No
claims beyond that.

## How to reproduce

1. `npx hardhat node` (terminal 1). 2. `node scripts/setupCaliper.js`.
3. `cd caliper && npm install` (first time). 4. `npm run bench:smoke`, then
`npm run bench`. 5. `node makeReport.js results/<folder>/benchmark-full.log results/<folder>`.
