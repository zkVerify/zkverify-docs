---
title: "zkEscrow"
sidebar_position: 5
---

# Direct Mode Quick Start

This tutorial follows the repository's `direct` submission flow.
If you want to read the docs side by side with the code, it is easiest to keep [JetHalo/zk-Escrow's `direct` branch](https://github.com/JetHalo/zk-Escrow/tree/direct) open as you go.
If you want to see the live app first, open the [zkEscrow direct-mode demo](https://zk-escrow-direct.vercel.app/escrow). It follows the same direct path described in this tutorial.

The browser generates a Groth16 proof locally, the server submits `proof`, `publicSignals`, and `vk` directly to Kurier, and once Kurier reaches `finalized`, the frontend requests an authorization signature before calling on-chain `finalize`.

> This tutorial is for **Base Sepolia testnet**, not Base mainnet. Wallet setup, RPC endpoints, contract addresses, test ETH, and on-chain interactions in this doc all assume Base Sepolia.

> The repository already includes the `wasm`, `.zkey`, and `vkey.json` artifacts needed for browser-side proving. If your goal is only to get the direct flow running, you can use those artifacts as-is. If you want to regenerate them from circuit source, the full process is included below.

## Prerequisite

Before you start, prepare the following:

- Node.js 22.x or newer
- npm
- Foundry
- A Base Sepolia wallet
- Test ETH in that wallet
- A working Kurier API key
- A deployed `ZKEscrowRelease` contract address
- The deployment block for that contract
- The private key that matches the contract's `finalizeAuthority`

## What you'll learn

By the end of this tutorial, you will have:

- A local environment that runs the direct mode flow
- A minimal working `apps/web/.env.local`
- A full debugging path from `deposit` to `prove` to `finalize`
- An optional path for rebuilding circuit artifacts and indexing with The Graph

## 1. Understand The Two Modes

First, make the difference between `direct` and `aggregation` explicit.

### Direct mode

The core idea of `direct` is "submit the proof directly, consume the result directly."

- Submit the full proof, public inputs, and verification key together to Kurier.
- The frontend only polls the proof status.
- Once the status reaches `finalized`, the flow moves straight into authorization and on-chain `finalize`.
- This repository's main path uses exactly this route, and `/api/submit-proof` is fixed to `submissionMode: direct`.

### Aggregation mode

`aggregation` adds one more batching layer on top of `direct`.

- After you submit the proof, you do not consume it immediately as a single result.
- You must wait until the proof is included in an aggregation batch.
- In addition to proof status, you also need the aggregation tuple, such as `domainId`, `aggregationId`, `leafCount`, `index`, and `merklePath`.
- The repository keeps `/api/proof-aggregation` for this route.

If your goal is to get the flow working end to end first, start with `direct`. That is also the repository's default route today.

## 2. Install The Project

### Install the web app dependencies

Install the frontend dependencies first:

```bash
cd apps/web
npm install
```

### Optional: install the subgraph dependencies

If you plan to use The Graph, install the subgraph dependencies as well:

```bash
cd indexer/subgraph
npm install
```

### Optional: run the contract tests

If you want to confirm the contract logic before anything else, run:

```bash
cd contracts
forge test
```

## 3. Generate The Proving Artifacts

If you do not want to use the proving artifacts already committed to the repository and instead want to regenerate `wasm`, `.zkey`, and `vkey.json` from circuit source, follow this section.

This is a manual flow. The repository does not currently wrap circuit build and trusted setup into a script.

### Install the circuit dependencies

`circuits/escrow/circom/escrowRelease.circom` depends on `circomlib`, so first add the local dependencies in `circuits/escrow`:

```bash
cd circuits/escrow
npm install circomlib snarkjs
```

You also need the `circom` binary installed on your machine.

### Compile `escrowRelease.circom`

Compile the circuit into `r1cs`, `wasm`, and `sym`:

```bash
cd circuits/escrow
mkdir -p build
circom circom/escrowRelease.circom --r1cs --wasm --sym -o build
```

After the command completes, the key outputs should be here:

- `build/escrowRelease.r1cs`
- `build/escrowRelease.sym`
- `build/escrowRelease_js/escrowRelease.wasm`

### Run the local trusted setup

This circuit uses `groth16`. For local development, you can run a local ceremony directly.

> This flow is only suitable for local development and tutorial reproduction. Do not treat it as a production setup.

```bash
cd circuits/escrow

snarkjs powersoftau new bn128 16 build/pot16_0000.ptau
snarkjs powersoftau contribute build/pot16_0000.ptau build/pot16_0001.ptau --name="zkescrow dev ptau" -e="replace-with-random-text"
snarkjs powersoftau prepare phase2 build/pot16_0001.ptau build/pot16_final.ptau

snarkjs groth16 setup build/escrowRelease.r1cs build/pot16_final.ptau build/escrowRelease_0000.zkey
snarkjs zkey contribute build/escrowRelease_0000.zkey build/escrowRelease_final.zkey --name="zkescrow dev zkey" -e="replace-with-random-text"
snarkjs zkey export verificationkey build/escrowRelease_final.zkey build/vkey.json
```

At this point, you should have:

- `build/escrowRelease_final.zkey`
- `build/vkey.json`

### Copy the artifacts into the web app

The frontend prover reads from `apps/web/public/zk/escrow`, so copy the generated artifacts there:

```bash
cp circuits/escrow/build/escrowRelease_js/escrowRelease.wasm apps/web/public/zk/escrow/escrowRelease.wasm
cp circuits/escrow/build/escrowRelease_final.zkey apps/web/public/zk/escrow/escrowRelease_final.zkey
cp circuits/escrow/build/vkey.json apps/web/public/zk/escrow/vkey.json
```

If you regenerated the artifacts, restart the `apps/web` development server so it does not keep serving stale cached files.

## 4. Configure The Direct Mode Environment

### Create `apps/web/.env.local`

Create `apps/web/.env.local` and fill in the values below:

```env
NEXT_PUBLIC_ESCROW_ADDRESS=0xYourEscrowAddress
NEXT_PUBLIC_DEPLOY_BLOCK=12345678
NEXT_PUBLIC_DOMAIN=111
NEXT_PUBLIC_APP_ID=222

NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://your-base-sepolia-rpc
INDEXER_RPC_URL=https://your-base-sepolia-rpc
INDEXER_STRATEGY=sqlite

KURIER_API_KEY=your-kurier-api-key
KURIER_API_URL=https://api-testnet.kurier.xyz/api/v1
FINALIZE_AUTH_PRIVATE_KEY=0xyour_finalize_authority_private_key

NEXT_PUBLIC_KURIER_POLL_ATTEMPTS=150
NEXT_PUBLIC_KURIER_POLL_INTERVAL_MS=4000
NEXT_PUBLIC_INDEXER_POLL_INTERVAL_MS=10000
```

### Understand the required values

- `NEXT_PUBLIC_ESCROW_ADDRESS` must be the deployed `ZKEscrowRelease` contract address.
- `NEXT_PUBLIC_DEPLOY_BLOCK` is the contract deployment block. The indexer starts scanning from there.
- `NEXT_PUBLIC_DOMAIN` and `NEXT_PUBLIC_APP_ID` must match the values used when the contract was deployed.
- `FINALIZE_AUTH_PRIVATE_KEY` must match the contract's `finalizeAuthority`, or the signature produced by `/api/authorize-finalize` will fail.
- For the first run, keep `INDEXER_STRATEGY=sqlite`. That lets the frontend scan the chain over RPC and cache results in local SQLite without requiring a subgraph first.

## 5. Start The Web App

### Run the development server

Start the development server from `apps/web`:

```bash
cd apps/web
npm run dev
```

### Open the escrow page

Then open:

```text
http://localhost:3000
```

The app should redirect to `/escrow` automatically.

If the page loads correctly, you should see:

- `Deposit` and `Withdraw` tabs
- A Base Sepolia network switcher
- A proof status panel

## 6. Run The Direct Flow

### Step 1: create a deposit

1. Connect your wallet.
2. Switch to Base Sepolia.
3. Enter the deposit amount and recipient address.
4. Click `Deposit & Lock`.

After the transaction succeeds, the page will generate a `credential`. Save it, because it will be used later to build the withdrawal proof.

### Step 2: generate and submit the proof

1. Paste the saved `credential` into the `Withdraw` tab.
2. Click `Unlock`.
3. The browser generates the proof locally.
4. The server submits the proof to Kurier in `direct` mode.
5. The frontend starts polling `/api/proof-status`.
6. Once the status reaches `finalized`, the server generates an authorization signature through `/api/authorize-finalize`.
7. The wallet sends the on-chain `finalize` transaction.
8. The recipient receives the funds.

This path does not call `/api/proof-aggregation`. If you see errors related to aggregation tuples, your environment does not match the direct-flow assumptions of this tutorial.

## 7. Build And Deploy The Graph Subgraph

If you do not want to rely on local SQLite chain scans, you can switch to The Graph.

### Install the subgraph dependencies

Enter `indexer/subgraph` first:

```bash
cd indexer/subgraph
npm install
```

### Provide the subgraph inputs

This subgraph reads `Deposited` and `Finalized` events, so at minimum prepare:

- `NEXT_PUBLIC_ESCROW_ADDRESS` or `SUBGRAPH_ESCROW_ADDRESS`
- `NEXT_PUBLIC_DEPLOY_BLOCK` or `SUBGRAPH_START_BLOCK`

Optional:

- `SUBGRAPH_NETWORK=base-sepolia`

If you already completed Step 4, you usually do not need to duplicate those core values. `npm run render` reads the existing environment variables directly.

### Generate `subgraph.yaml`

`indexer/subgraph/subgraph.template.yaml` is a template, not a deployable manifest. Render it into a real `subgraph.yaml` first:

```bash
cd indexer/subgraph
npm run render
```

### Generate types and build the subgraph

```bash
cd indexer/subgraph
npm run codegen
npm run build
```

At that point, local subgraph generation and build are complete.

### Deploy to The Graph Studio

Prepare your Graph Studio deploy key and slug:

```bash
export GRAPH_DEPLOY_KEY=<your_studio_deploy_key>
export SUBGRAPH_SLUG=<your_studio_subgraph_slug>
```

Then deploy:

```bash
cd indexer/subgraph
npm run auth
npm run deploy
```

If you do not want to use the npm scripts, you can run the commands directly:

```bash
graph auth "$GRAPH_DEPLOY_KEY"
graph deploy "$SUBGRAPH_SLUG" subgraph.yaml \
  --node https://api.studio.thegraph.com/deploy/ \
  --deploy-key "$GRAPH_DEPLOY_KEY"
```

### Connect the query URL to the web app

After deployment succeeds, take the query URL from Graph Studio and write it back into `apps/web/.env.local`:

```env
INDEXER_STRATEGY=thegraph
THEGRAPH_SUBGRAPH_URL=https://your-subgraph-query-url
```

If you want The Graph first and local scanning only as fallback, you can also use:

```env
INDEXER_STRATEGY=hybrid
```

## Troubleshooting

### `Missing NEXT_PUBLIC_ESCROW_ADDRESS`

This means `apps/web/.env.local` is still missing the contract address, or you changed the env file without restarting the development server.

### `Local scan missing deposits`

Usually this means `NEXT_PUBLIC_DEPLOY_BLOCK` is set too late, so local indexing started from the wrong block. Change it to the actual deployment block, then click `Rescan` in the UI.

### `Proof not finalized yet`

This means Kurier has not pushed this direct submission to `finalized` yet. Check `KURIER_API_KEY`, RPC configuration, and proof parameters first, then inspect the raw Kurier status.

### `bad authorization`

Confirm that the address derived from `FINALIZE_AUTH_PRIVATE_KEY` is the same address configured as the contract's `finalizeAuthority`.
