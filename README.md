# zkVerify Loyalty (ProofPoints) — Ready-to-deploy repo

This repository contains a small static frontend and a minimal Node.js demo backend to run a loyalty/airdrop claim flow.

Structure:
- `public/` - frontend (index.html, style.css, app.js)
- `server/` - Node demo server (server.js, package.json)

Quick start (local):
1. Copy `public` to your webserver root (or serve via the Node server).
2. Run the demo Node server:
   ```bash
   cd server
   npm install
   node server.js
   ```
3. Visit `http://localhost:3000/` and connect a wallet.

Notes:
- This is a demo. Do **not** use the JSON file DB in production.
- Replace the claim handler to mint/transfer tokens or to create on-chain attestations.
- Protect signer keys, use HTTPS, rate-limit, and integrate a proper DB.

If you want: I can add Merkle-claim generator, a Solidity contract for on-chain claim, or convert the server to use PostgreSQL. Tell me which and I'll add it.
