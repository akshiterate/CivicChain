# Viva: frontend (`frontend/src/`)

## Files

- `contract.js` — ALL chain talk lives here: env config, human-readable ABI,
  `getReadOnlyContract()` (public feed, no wallet), `getWriteContract()`
  (MetaMask signer), `connectWallet()`, `loadAllComplaints()` loop,
  `normalizeComplaint()` (BigInt → Number).
- `App.jsx` — wallet bar, `SubmitForm`, filters + `ComplaintList`, authority
  dashboard section. State: `wallet`, `chainId`, `authority`, `complaints`,
  filters, `message`, `busy`.
- `main.jsx`, `style.css`, `index.html`, `vite.config.js` — plain Vite shell.

## Explain the flow

Connect → address in state. Submit → write-contract call → pending/confirmed →
reload. Filters are a plain `for` loop over the loaded list (`visibleComplaints()`).
Advance buttons disable unless `wallet == authority`, but the contract is the
real guard.

## Likely questions

- "Why human-readable ABI?" — One line per used function; same calls, far
  easier to explain than the 100-line JSON artifact.
- "Where do BigInts get converted?" — `normalizeComplaint()`: `Number(raw.id)`,
  `Number(raw.createdAt)`, `Number(raw.status)`.
- "What secrets are in the frontend?" — None allowed: only contract address,
  chain id, public RPC URL (`VITE_*`). No private key anywhere.
