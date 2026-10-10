# Website hosting

## Status (2026-10-10): build-ready, NOT yet hosted (needs Sepolia address first)

`frontend/dist/` builds cleanly today (`npm run build`). Hosting is pointless
before the Sepolia contract exists, because the site would point at nothing.

## Build (exact)

```powershell
cd frontend
Copy-Item .env.example .env   # then set the three Sepolia values below
& "C:\Program Files\nodejs\npm.cmd" run build   # outputs frontend/dist/
```

Production `.env` (public data only — never a private key):

```
VITE_CONTRACT_ADDRESS=0xDeployedSepoliaAddress
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://rpc.sepolia.org   # or Infura/Alchemy public endpoint
```

## Host over HTTPS (any static host; Vercel example)

1. `frontend/dist/` is plain static files — no server needed, works without the
   dev machine online.
2. Vercel: import the GitHub repo, set Root Directory `frontend`, Build Command
   `npm run build`, Output Directory `dist`, add the three `VITE_*` env vars in
   the dashboard, deploy. Netlify / GitHub Pages + `vite.config.js` base work
   the same way.
3. Custom domain: add it in the host dashboard (DNS CNAME as instructed),
   HTTPS is automatic.
4. Do NOT claim the site is live until these steps are actually done and the URL
   + contract address are recorded here.

## Live record

| Item | Value |
|------|-------|
| URL | _pending_ |
| Contract used | _pending (Sepolia)_ |
