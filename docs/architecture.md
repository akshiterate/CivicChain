# Architecture

## One-sentence version

React buttons call contract functions through ethers; MetaMask signs; Hardhat
or Sepolia mines the transaction; the UI re-reads state from the chain.

## Boxes and arrows

```
MetaMask (signs) ──► frontend/src/contract.js (ethers v6) ──► CivicChain.sol
        ▲                              │                              │
        │ wallet bar                   │ read: getComplaint,          │ stores:
        │ shows address                │ getTotalComplaints,          │ Complaint[] + authority
        │ + wrong-network warning      │ authority()                  │ emits events
        │                              ▼                              ▼
                   public feed ◄── loadAllComplaints() loop   ComplaintSubmitted
                   submit form ──► submitComplaint()          StatusUpdated
                   authority dashboard ──► updateStatus()
```

## Data

`Complaint { id, description, category, locationText, reporter, createdAt, status }`.
IDs are array indexes: `0 .. total-1`. Status is an enum number 0/1/2.
`reporter` and `createdAt` are set by the contract from `msg.sender` and
`block.timestamp` — the frontend cannot fake them.

## Trust boundaries

- Authority check is in `onlyAuthority` in the contract. The frontend button is
  convenience only; a non-authority signer gets a revert.
- Status order is enforced by `newNumber == oldNumber + 1` in the contract.
- Reads need no wallet (`JsonRpcProvider` + public RPC).

## Networks

- Local: Hardhat node, chainId 31337, JSON-RPC + WebSocket on port 8545.
- Public: Sepolia, chainId 11155111. Frontend picks address/chain via
  `VITE_CONTRACT_ADDRESS` / `VITE_CHAIN_ID` / `VITE_RPC_URL` (public data only).

## Caliper

Caliper manager (ethereum connector, `ws://127.0.0.1:8545`) drives
`caliper/workloads/submit.js` + `status.js` through `sutAdapter.sendRequests`,
so every tx is counted. Contract is deployed by `scripts/setupCaliper.js`
because Caliper 0.5.0 cannot pass constructor arguments. One worker, one funded
account (its nonce is tracked by the connector). Local node only.
