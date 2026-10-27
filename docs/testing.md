# Testing

## Contract tests — `npx hardhat test` (12 passing, 2026-10-10)

```
CivicChain
  ✔ sets the authority from the constructor
  ✔ reverts when constructor gets the zero address
  ✔ submits a complaint with unique IDs
  ✔ retrieves complaint details and timestamp
  ✔ rejects empty descriptions
  ✔ rejects unknown complaint IDs
  ✔ lets only the authority update status, forward by one step
  ✔ rejects skipped, repeated, and backwards transitions
  ✔ rejects status updates for unknown IDs
  ✔ emits ComplaintSubmitted and StatusUpdated events
  ✔ filters by status and category
  ✔ lets the authority rotate to a new wallet

12 passing
```

Coverage maps to the spec: submission, retrieval, unique IDs, unauthorized
updates, valid transitions, skipped/reversed rejections, bad IDs/inputs, events,
filters, authority rotation.

## Lifecycle script — `npx hardhat run scripts/lifecycle.js`

```
1. Citizen wallet: 0x7099...  Authority wallet: 0x3C44...
Deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
2. Citizen submits complaint... Submit tx: 0x4f20...
3. Read complaint... id=0 status=0 reporter=0x7099...
4. Authority advances Reported -> In Progress... Update tx: 0x8980...
5. Verify... New status: 1, Event StatusUpdated id=0 old=0 new=1
6. Unauthorized wallet tries to update (must fail)...
   Blocked as expected: ... 'CivicChain: caller is not authority'
7. Authority resolves... Final status: 2. INTEGRATION OK
```

## Frontend build — `npm run build` in `frontend/`

`vite build` succeeds (179 modules, ~416 kB JS). Manual browser flow (MetaMask +
local node) is described in `README.md`; automated browser tests are out of
scope for the two-day deadline.

## Benchmark smoke — Caliper `smokeConfig.yaml`, 2026-10-26

`submit-smoke: 5 succ, 0 fail, 2.5 TPS, avg latency 0.02s, 8.24s total.`
Full three-round run the same session: 10/0 @5.5 TPS, 100/0 @20.2 TPS,
20/0 @5.3 TPS. Numbers in `docs/benchmarking.md`, raw log
`caliper/results/2026-10-26/benchmark-smoke.log`.
