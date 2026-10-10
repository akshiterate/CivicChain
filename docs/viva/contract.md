# Viva: smart contract (`contracts/CivicChain.sol`)

## What it is

One contract stores every complaint in a `Complaint[]` array. The index IS the
id. `authority` is one municipal wallet address.

## Explain each piece

- `enum Status { Reported, InProgress, Resolved }` — 0, 1, 2. Numbers matter
  for the transition rule.
- `struct Complaint` — id, description, category, locationText, reporter,
  createdAt, status. `reporter`/`createdAt` come from `msg.sender` /
  `block.timestamp`, so users can't fake them.
- `constructor(address _authority)` — sets authority, reverts on zero address.
- `submitComplaint(description, category, locationText)` — checks description
  non-empty, pushes with `status: Reported`, emits `ComplaintSubmitted`, returns id.
- `modifier onlyAuthority` — `require(msg.sender == authority)`. Every
  restricted function uses it.
- `updateStatus(id, newStatus)` — checks id exists, then
  `require(newNumber == oldNumber + 1)`: exactly one step forward. Skip (0→2),
  repeat (1→1), backwards (1→0) all revert. Emits `StatusUpdated`.
- Views: `getComplaint`, `getTotalComplaints`, `getComplaintsByStatus` (two-pass
  count-then-copy loop), `getComplaintsByCategory` (`keccak256` string compare),
  `setAuthority` (rotation, authority-only).

## Likely questions

- "Why array index as id?" — Free uniqueness, no counter variable, ids are
  0..total-1. Trade-off: no deletion, which we don't need.
- "What stops a citizen changing status?" — The contract's `onlyAuthority`,
  not the UI. Test proves a stranger's tx reverts.
- "What stops skipping Reported→Resolved?" — `newNumber == oldNumber + 1`.
- "Why two loops in filters?" — Solidity memory arrays need fixed size; first
  loop counts, second fills.
