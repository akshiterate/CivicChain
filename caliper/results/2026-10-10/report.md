# CivicChain Caliper results - 2026-10-10 14:07:59

- Source log: `benchmark-full.log`
- Contract: `0xa513E6E4b8f2a923D98304ec87F64353C4D5C853`
- Chain: local Hardhat node (chainId 31337), automine
- Charts: `charts.html` (same folder)

| Round | Succ | Fail | Send rate (TPS) | Max lat (s) | Min lat (s) | Avg lat (s) | Throughput (TPS) |
|---|---|---|---|---|---|---|---|
| submit-smoke | 10 | 0 | 5.5 | 0.03 | 0.01 | 0.01 | 5.5 |
| submit-load | 100 | 0 | 20.2 | 0.01 | 0.01 | 0.01 | 20.2 |
| status-update | 20 | 0 | 5.3 | 0.01 | 0.01 | 0.01 | 5.3 |

Total: 130 succeeded, 0 failed.

> Local automine only. These latencies are not testnet performance.
