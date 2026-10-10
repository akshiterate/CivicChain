# Viva: authorization + transaction lifecycle

## Authorization

One address (`authority`) may call `updateStatus`/`setAuthority`. Enforcement is
`require(msg.sender == authority)` on-chain. The frontend compares the connected
wallet to `authority()` only to enable/disable buttons — a non-authority user
clicking anyway gets a revert, which the UI shows as an error message.

## Lifecycle of one complaint (trace it)

1. Citizen clicks Submit → `App.submitComplaint()` → `getWriteContract()` wraps
   MetaMask signer → `contract.submitComplaint(...)` → MetaMask popup → `tx.hash`
   shown as Pending → `tx.wait()` mines → "Confirmed" → `refreshFeed()`.
2. Feed reloads via `loadAllComplaints()`: `getTotalComplaints()`, then
   `getComplaint(i)` for each i, newest first.
3. Authority clicks Advance → `updateStatus(id, old+1)` → same pending/confirmed
   flow → `StatusUpdated` event exists on the receipt (checked in
   `scripts/lifecycle.js`).
4. Stranger attempts update → tx reverts with
   `CivicChain: caller is not authority` → UI shows "Update error: ...".

## Likely questions

- "Where is the pending/success/error UI?" — `message` state in `App.jsx`,
  set before send / after `tx.wait()` / in `catch` via `errorMessage()`.
- "Wrong network?" — `chainId` from `connectWallet()` vs `EXPECTED_CHAIN_ID`
  (`VITE_CHAIN_ID`); banner shows when they differ.
- "How do you prove the event fired?" — `lifecycle.js` parses receipt logs for
  `StatusUpdated`; Hardhat test uses `.to.emit(...)`.
