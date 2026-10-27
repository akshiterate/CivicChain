# CivicChain Caliper results - 2026-10-26 13:27:23

- Source log: `benchmark-full.log`
- Contract: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- Chain: local Hardhat node (chainId 31337), automine
- Charts: `charts.html` (same folder)

| Round | Succ | Fail | Send rate (TPS) | Max lat (s) | Min lat (s) | Avg lat (s) | Throughput (TPS) |
|---|---|---|---|---|---|---|---|
| submit-smoke | 10 | 0 | 5.5 | 0.06 | 0.01 | 0.02 | 5.5 |
| submit-load | 100 | 0 | 20.2 | 0.02 | 0.01 | 0.01 | 20.2 |
| status-update | 20 | 0 | 5.3 | 0.05 | 0.01 | 0.01 | 5.2 |

Total: 130 succeeded, 0 failed.

> Local automine only. These latencies are not testnet performance.
