# PROJECT_SPEC.md — CivicChain Specification

## 1. Goal

CivicChain is a decentralized civic complaint app. Citizens report potholes,
broken streetlights, garbage overflow, etc. An authorized municipal wallet
updates statuses. Anyone can read and verify complaints. All state lives in
one Solidity contract on Ethereum (local Hardhat network for dev, Sepolia for public).

No database, no backend. Contract = source of truth.

## 2. Roles

| Role      | What they do | How enforced |
|-----------|--------------|--------------|
| Citizen   | Connects MetaMask, submits complaints | Anyone with a wallet can call `submitComplaint` |
| Authority | Advances status Reported -> In Progress -> Resolved | Contract `onlyAuthority` check on `updateStatus` |
| Public    | Reads complaints, filters, verifies history | View functions + events, no wallet needed to read |

## 3. Complaint data model

```solidity
enum Status { Reported, InProgress, Resolved }

struct Complaint {
    uint256 id;          // unique, starts at 0, increments by 1
    string description;  // required, non-empty
    string category;     // e.g. "Pothole", "Streetlight", "Garbage", "Other"
    string locationText; // optional free text, e.g. "MG Road near bus stop"
    address reporter;    // msg.sender at submission
    uint256 createdAt;   // block.timestamp
    Status status;       // starts Reported
}
```

Stored in `Complaint[] private complaints`. Authority address in `address public authority`.

## 4. Contract functions

- `constructor(address _authority)` — sets authority. Reverts on zero address.
- `submitComplaint(string description, string category, string locationText)` — anyone can call. Validates description non-empty. Pushes new complaint, emits `ComplaintSubmitted(id, reporter, category)`. Returns new id.
- `updateStatus(uint256 id, Status newStatus)` — ONLY authority. Validates id exists. Requires `newStatus == oldStatus + 1` (forward-only, no skip, no repeat, no backwards). Emits `StatusUpdated(id, oldStatus, newStatus)`.
- `getComplaint(uint256 id)` — view, returns one complaint. Reverts on bad id.
- `getTotalComplaints()` — view, returns count.
- `getComplaintsByStatus(Status)` / `getComplaintsByCategory(string)` — view helpers for filtering. Category match is exact string compare via `keccak256`.
- `setAuthority(address)` — only current authority, lets municipality rotate wallet.

Events:

```solidity
event ComplaintSubmitted(uint256 indexed id, address indexed reporter, string category);
event StatusUpdated(uint256 indexed id, Status oldStatus, Status newStatus);
```

## 5. Frontend pages (single-page app, simple sections)

1. **Wallet bar** — connect MetaMask, show address, show network, warn on wrong network (Sepolia `11155111` / localhost `31337`).
2. **Submit form** — description, category dropdown, location text. Shows pending/success/error + tx hash.
3. **Public feed** — lists all complaints, filter by status + category, click for details.
4. **Authority dashboard** — same list + `Advance status` button per complaint, visible to everyone but the transaction reverts unless signer is authority. Shows pending/success/error.

Blockchain calls trace directly: Component -> `frontend/src/contract.js` (ethers v6) -> `CivicChain.sol`.

## 6. Networks

- Local: Hardhat node, chainId `31337`, for dev + Caliper.
- Public: Sepolia, chainId `11155111`, for demo. Contract address + tx hash recorded in `docs/` after deploy.
- Frontend reads `VITE_CONTRACT_ADDRESS`, `VITE_CHAIN_ID`, `VITE_RPC_URL` (public endpoint only).

## 7. Benchmarking (Caliper)

- Connector: `@hyperledger/caliper-ethereum`, connects to local Hardhat JSON-RPC.
- Workloads: `submitComplaint` and `updateStatus` with dedicated accounts.
- Metrics: throughput, latency (avg/p50/p95/p99), success/fail counts, CPU/memory via local sampling.
- Never benchmark against Sepolia (would spam public testnet).

## 8. Non-goals (do NOT build)

- No login system, no backend, no database.
- No elaborate role framework (one `authority` address is enough).
- No animations/visual effects over functionality.
- No extra token, no payments.
