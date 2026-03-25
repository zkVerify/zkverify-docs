---
title: "Poly Verified"
sidebar_position: 8
---

# Poly Verified Installation and Local Startup

## First, what this project is for

[polyverified](https://github.com/JetHalo/polyverified) is a paid signal product for Polymarket. Users do not arrive and read the conclusions for free. They pay through `x402` first, then unlock the directional signal for the current market. The current primary line is hourly `BTC / ETH` signals, while daily `Gold / Silver` signals are also still supported.

The real problem this product is trying to solve is larger than "how to sell a signal." Prediction products are always vulnerable to the same suspicion: did you really publish that signal before the result was known? People look at win rate, but what they really care about is whether losing calls were deleted, whether direction was changed after the fact, and whether timestamps were backfilled.

The design here is direct:

- publish the signal first, but keep the full contents hidden behind a commitment
- let the user pay through `x402` before revealing the premium signal
- anchor the commitment on-chain first so there is a public timestamp
- reveal what was actually sent only after the market settles
- prove with `zkVerify` that the reveal really matches the earlier commitment

That means the user is not looking at just another page saying "this was my win rate this week." They can go back and audit each signal. Even if a signal was wrong, the system can still prove that it was the version actually published at the time rather than a retroactively edited one. `zkVerify` turns that claim from "trust me" into something an external verifier can check.

## Roughly how the project is split

You can think of it as five layers:

- `Web app and API`
  This lives in `apps/polymarket-signals`. It handles page rendering, wallet sessions, premium unlock, history views, and both public and internal APIs.
- `Worker and scheduling scripts`
  This lives in `scripts/polymarket-signals`. It triggers `/api/internal/tick`, retries anchors, and advances the signal lifecycle on a fixed cadence instead of hiding background work inside user requests.
- `Database state layer`
  `PostgreSQL` stores more than page data. It also holds signals, purchases, access grants, anchor state, and proof state. It is the operating ledger for the full flow.
- `Proof circuits and proving toolchain`
  Noir circuits under `circuits` implement the commitment and reveal proof logic. `nargo` and `bb` actually execute that logic and produce a proof that can be submitted.
- `On-chain and external services`
  This includes `AnchorRegistry`, the payment token, `Base Sepolia RPC`, `zkVerify`, the `Polymarket API`, and the `Binance API`. The first group provides verifiability. The second provides market facts and price context.

The installation guide below follows that same shape so that each layer, the services it needs, and how to wire it locally all stay explicit.

## Prerequisites

Before you begin, prepare these tools and services:

- `Git`
- `Node.js 22.x`
- `npm 10.x`
- A writable `PostgreSQL` instance
- `forge` and `cast` for deploying and checking on-chain contracts
- `nargo` and `bb` for running Noir circuits locally and generating `UltraHonk` proofs
- A `Base Sepolia RPC` endpoint and a deployment private key with test funds
- A working `zkVerify RPC` endpoint and the corresponding account

Each prerequisite has a clear responsibility:

- `Node.js + npm` run the Next.js web service, worker scripts, and repository scripts.
- `PostgreSQL` is the system state layer. Signals, commitments, purchases, access grants, and proof state are all written there.
- `Foundry` handles the on-chain side. The repository's `anchor` and `usdz` deployment scripts both call `forge` and `cast`.
- `Noir + bb` handle the proving side. `Noir` generates the witness, then `bb` turns the witness and compiled circuit artifacts into an `UltraHonk` proof.
- `Base Sepolia` carries two responsibilities: it anchors commitments on-chain and serves as the local payment settlement environment for `x402`.
- `zkVerify` receives the proof and returns a traceable proof reference, so reveal is not justified only by the local database.

> If your only goal right now is to get the page and worker running, the database is mandatory. `anchor`, `zkVerify`, and `DeepSeek` can be connected later.

## What you will complete

By the end of this tutorial, you will have a locally runnable environment and understand how these parts fit together:

- clone the repository and install workspace dependencies
- install the local on-chain and proving toolchain
- initialize `PostgreSQL`
- configure `apps/polymarket-signals/.env`
- start the `web` service and the `worker`
- connect `x402`, Base Sepolia anchoring, and `zkVerify`
- verify the main flow with repository-provided commands

## Install the project

### 1. Get the repository

Clone the repository locally:

```bash
git clone https://github.com/JetHalo/polyverified.git
cd polyverified
```

All commands below assume you are running from the repository root. This project uses `npm workspaces`, so starting from the root is the most reliable approach, and all the relative paths across `apps`, `contracts`, `circuits`, and `scripts` are organized around that root.

### 2. Install JavaScript dependencies

Run this from the root:

```bash
npm install
```

Do not install only inside `apps/polymarket-signals`. The repository puts frontend code, scripts, and runtime commands under the root workspace configuration, so root-level installation keeps the lockfile and dependency graph consistent.

### 3. Install Foundry

Contract deployment and on-chain checks depend on `forge` and `cast`. If Foundry is not installed yet:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
forge --version
cast --version
```

Why is Foundry required here rather than just a wallet extension?

- `forge` compiles and deploys `AnchorRegistry.sol` and `USDZ.sol`
- `cast send` submits the anchor transaction on-chain
- `cast receipt` and `cast code` verify transaction status and whether a contract address really has code

So in this project Foundry is not an optional developer preference. It is the command-line entry point for the on-chain support layer.

### 4. Install Noir and Barretenberg

If you want to run the full commitment and proof path locally, install the exact proving versions used by the repository. The current versions are:

- `Noir / Nargo 1.0.0-beta.6`
- `bb 0.84.0`

Install `noirup` first and switch to the project version:

```bash
curl -fsSL https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
noirup --version 1.0.0-beta.6
nargo --version
```

Then install `bb`:

```bash
sudo bash scripts/docker/install-bb.sh 0.84.0
bb --version
```

These versions are the same combination already validated by the repository `Dockerfile`. That matters because Noir circuits, compiled artifacts, and the proving backend are tightly coupled. When versions drift, the common failure mode is not a small feature mismatch. It is witness, VK, or proof incompatibility.

Their roles in this project are:

- `circuits/polymarket-commitment-hash-noir` compresses commitment inputs into a stable field output
- `circuits/polymarket-commit-reveal-noir` proves that reveal data matches an earlier commitment
- `nargo execute` generates the witness
- `bb prove` and `bb write_vk` generate the proof and verification key

### 5. Prepare PostgreSQL

Before starting the project, prepare a writable database. You can connect an existing Postgres instance or launch a local one. For example, with Docker:

```bash
docker run --name polyverified-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=polyverified \
  -p 5432:5432 \
  -d postgres:16
```

This database is not just for rendering page data. It handles several critical jobs:

- storing market snapshots and observation data for worker cadence processing
- storing `signals`, `signal_commitment_witnesses`, `signal_anchors`, and `signal_reveals`
- storing `purchases` and `access_grants` so payment and content access stay bound together
- storing `zk_proofs` so proof status and external proof references remain queryable

In other words, it is the operating ledger of the application, not an optional cache layer.

### 6. Write runtime environment variables

Create local development config in `apps/polymarket-signals/.env`:

```dotenv
# Core runtime
APP_BASE_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/polyverified
TREASURY_ADDRESS=0xYourTreasuryAddress

# x402 payment
PAYMENT_NETWORK=base-sepolia
PAYMENT_TOKEN=USDZ
PAYMENT_DISPLAY_AMOUNT=$1.00
PAYMENT_TOKEN_AMOUNT_ATOMIC=1000000
PAYMENT_TOKEN_ADDRESS=0xYourUSDZTokenAddress
PAYMENT_TOKEN_DECIMALS=6
PAYMENT_EIP712_NAME=USDZ
PAYMENT_EIP712_VERSION=1
X402_FACILITATOR_URL=https://facilitator.x402.org

# Worker
TICK_INTERVAL_MS=30000
ENABLE_ANCHOR_WATCH=true

# Anchor service
ANCHOR_ENABLED=false
ANCHOR_NETWORK=base-sepolia
ANCHOR_CHAIN_ID=84532
ANCHOR_RPC_URL=https://base-sepolia.example/rpc
ANCHOR_CONTRACT_ADDRESS=0xYourAnchorRegistryAddress
ANCHOR_SIGNER_PRIVATE_KEY=0xYourSignerPrivateKey
ANCHOR_EXPLORER_BASE_URL=https://sepolia.basescan.org/tx/

# zkVerify
ZKVERIFY_RPC_URL=wss://your-zkverify-endpoint
ZKVERIFY_SEED=your zkverify seed phrase
ZKVERIFY_ACCOUNT_ADDRESS=your zkverify account address
ZKVERIFY_EXPLORER_BASE_URL=https://zkverify-testnet.subscan.io/extrinsic/

# Market data and optional review layer
POLYMARKET_API_BASE_URL=https://gamma-api.polymarket.com
BINANCE_API_BASE_URL=https://api.binance.com
DEEPSEEK_ENABLED=false
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat
```

Those variables map to different supporting services:

- `APP_BASE_URL` tells the worker which web service instance to poll. The worker does not call internal functions directly. It periodically requests `/api/internal/tick` and `/api/internal/retry-anchors`.
- `DATABASE_URL` and `TREASURY_ADDRESS` are hard runtime requirements. The first decides where state is stored, the second defines who receives premium-unlock payments.
- `PAYMENT_*` define the `x402` pricing metadata. The server declares price, asset address, recipient, and network first. After the client pays successfully, the server stores the purchase and issues the access grant.
- `ANCHOR_*` configure the on-chain anchoring service. The project sends the commitment, `signalIdHash`, and prediction time to `AnchorRegistry`, so the question "was this forecast edited later?" does not depend only on the local database.
- `ZKVERIFY_*` configure the proof submission service. The app generates the proof locally, submits it to `zkVerify`, and then writes the returned transaction hash or statement back into the database.
- `POLYMARKET_API_BASE_URL` and `BINANCE_API_BASE_URL` provide the market fact source and price context source. The first tells the system what markets exist and when they open and settle. The second gives the strategy a more continuous price series.
- `DEEPSEEK_*` define an optional review layer. The product can run without it. When enabled, it acts more like an additional policy check than a hard dependency of the core flow.

> In the current implementation, as soon as you provide both `ANCHOR_RPC_URL` and `ANCHOR_SIGNER_PRIVATE_KEY`, exact `x402` payment settlement prefers the local facilitator signer over the remote `X402_FACILITATOR_URL`. That makes local environments more self-contained, but it also means the same chain signing configuration participates in both payment and anchoring.

### 7. Initialize the database

Once the env is ready, run:

```bash
npm run db:init
```

This command creates the repository-defined schema. It is idempotent, so running it more than once will not drop existing tables.

The reasoning is simple: the app does not auto-migrate all schema on startup. It depends on an explicit init step to create core tables such as `signals`, `purchases`, and `zk_proofs`. Without it, the web service can boot, but it fails quickly once it tries to read or write real state.

### 8. Start the web service

Start the page and API service first:

```bash
npm run dev
```

The default local development address is:

```text
http://localhost:3000
```

This service handles three responsibilities:

- rendering the frontend pages
- serving public APIs and internal scheduling APIs
- exposing the `x402`-protected premium-unlock route

In practice, it is both the user entry point and the application's control plane. The worker, manual `tick`, and proof retries all drive the system through the internal APIs exposed here.

### 9. Start the worker

Open a second terminal and run this from the repository root:

```bash
npm run tick:watch
```

The worker polls internal endpoints on the `TICK_INTERVAL_MS` cadence:

- `/api/internal/tick`
- `/api/internal/retry-anchors`, as long as `ENABLE_ANCHOR_WATCH=true`

That separation is deliberate. The project keeps page serving and scheduled tasks apart so user requests do not also become the scheduling engine. In other words, opening the page does not opportunistically generate a signal. Signal creation, reveal, and anchor retry all advance under an independent worker loop.

If you want to trigger a single lifecycle step manually instead, run:

```bash
npm run tick
```

### 10. Deploy or connect the on-chain supporting services

If you already have an `AnchorRegistry` and a payment token, write those addresses into `.env` and jump to the next section. Otherwise, use the repository scripts to deploy the two contracts needed for a test environment.

Deploy `AnchorRegistry` first:

```bash
npm run anchor:deploy
```

This contract is intentionally minimal. It does one thing: emit `CommitmentAnchored`. It does not maintain complex business state on-chain. It just writes the commitment, `signalIdHash`, and timestamp publicly, which matches the project's need for an externally auditable anchor with low gas cost.

Then deploy `USDZ`:

```bash
npm run usdz:deploy
```

This token exists so the local and testnet `x402` unlock flow has a concrete payment rail. It supports `transferWithAuthorization`, which is an `EIP-712`-based signed transfer authorization. That lets premium unlock bind payment and authorization more directly than a traditional `approve -> transferFrom` sequence.

After both deployments succeed, write the returned addresses back into `apps/polymarket-signals/.env`:

- write the `AnchorRegistry` address to `ANCHOR_CONTRACT_ADDRESS`
- write the `USDZ` address to `PAYMENT_TOKEN_ADDRESS`
- confirm `PAYMENT_TOKEN_AMOUNT_ATOMIC=1000000` and `PAYMENT_TOKEN_DECIMALS=6`
- switch `ANCHOR_ENABLED` from `false` to `true`

After changing the env, restart both `web` and `worker` so the runtime config is reloaded.

### 11. Verify the anchor path

Once the contracts are deployed, check that the contract address actually has code:

```bash
npm run anchor:check
```

Then send a test anchor:

```bash
npm run anchor:test
```

Those commands validate two different things:

- `anchor:check` proves you did not configure an empty address
- `anchor:test` proves that signer, RPC, ABI, and transaction broadcast all work together

If this step fails, the worker can still generate signals, but anchor state will stay at `pending` or `failed`.

### 12. Verify the proof submission path

Once the database contains a prove-able signal, you can trigger proof submission manually:

```bash
npm run zk:prove-signal -- <signal-id>
```

That command requests:

```text
/api/internal/prove-signal/<signal-id>
```

The full process is:

- fetch the signal and witness from the database
- generate the witness with the `Noir` circuit
- produce an `UltraHonk` proof with `bb`
- submit the proof to `zkVerify`
- write the returned `tx hash` or `statement` back into the local database

The most important reason to do this is not just to rerun reveal. It is to let an independent verification network attest that the reveal is consistent with the earlier commitment.

## Verify the installation

At minimum, run these commands before you call the local environment usable:

```bash
npm test
npm run build
npm run contracts:test
npm run tick
```

They cover:

- `npm test`: frontend and backend unit tests
- `npm run build`: whether the Next.js production build succeeds
- `npm run contracts:test`: whether the Foundry contract tests pass
- `npm run tick`: whether the worker lifecycle entrypoint can run manually at least once

If your on-chain config is already connected, add:

```bash
npm run anchor:check
npm run anchor:test
```

If `zkVerify` is also ready, use a generated `signal-id` to trigger:

```bash
npm run zk:prove-signal -- <signal-id>
```

## Common blockers

### `DATABASE_URL is required`

This means `apps/polymarket-signals/.env` was not loaded correctly, or the database variable is still missing. Check that `DATABASE_URL` exists and that you are running the command from the repository root.

### `PAYMENT_TOKEN_AMOUNT_ATOMIC and PAYMENT_TOKEN_ADDRESS are required for x402`

This means you already hit the premium unlock route, but the `x402` payment asset is not fully configured. At minimum, provide `PAYMENT_TOKEN_AMOUNT_ATOMIC`, `PAYMENT_TOKEN_ADDRESS`, and `TREASURY_ADDRESS`.

### `ANCHOR_* is required when anchoring is enabled`

This means you turned on `ANCHOR_ENABLED=true`, but RPC, contract address, or signer config for the chain layer is still incomplete. Once anchoring is enabled, the project does not fall back to a "database-only" mode.

### `ZKVERIFY_RPC_URL is required` or `ZKVERIFY_SEED is required`

This means you reached the proof submission path but the zkVerify account configuration is still incomplete. A proof being generated locally does not mean it was submitted to the external verification network. Without those configs, the flow stops before submission.
