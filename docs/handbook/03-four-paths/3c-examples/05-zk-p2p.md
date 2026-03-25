---
title: "zkP2P"
sidebar_position: 6
---

# Local zkp2p Setup

If you want to start from the exact codebase used in this guide, use the [zkp2p-demo](https://github.com/JetHalo/zkp2p-demo) repository directly.

## What this project does

You can think of `zkp2p` as an OTC tool. The buyer pays the seller with a real bank transfer first, then the frontend and browser plugin turn "this payment really happened" into a verifiable proof. Once the proof passes, the contract releases the previously locked collateral on-chain.

In this demo, the real payment record comes from Wise. The browser extension handles capture and proving, the server verifies the attestation and forwards the proof, and the contract releases funds based on the aggregation result.

## Main parts of the project

At the repository level, a local run mainly touches these pieces:

- `apps/web`: the OTC web app itself, plus `/api/submit-proof`, `/api/proof-status`, `/api/proof-aggregation`, and `/api/verify-wise-attestation`
- `apps/proof-plugin`: the browser extension that starts capture, triggers proving, submits proofs, and polls status
- `apps/tlsn-verifier`: the server-side verifier that confirms the Wise attestation is real and produces `wiseReceiptHash`
- `apps/tlsn-wise-plugin` and `apps/tlsn-wasm-host`: the Wise TLSN wasm plugin and the static host that serves it

On top of that, you still need a deployed `Zkp2pDepositPool` contract and a corresponding subgraph to handle on-chain release and read chain state.

## Prerequisites

Before you start, prepare the following:

- Node.js 20 or newer
- npm
- Chrome or Edge with `Developer mode` available
- A working Kurier configuration set: `KURIER_API_URL`, `KURIER_API_KEY`, `KURIER_VK_HASH`, and `KURIER_AGGREGATION_DOMAIN_ID`
- A deployed `Zkp2pDepositPool` contract address
- A working Goldsky or The Graph subgraph URL for seller liquidity and commitments queries

Optional:

- Foundry, if you want to run contract tests locally or redeploy contracts
- Noir / `nargo`, if you want to recompile the circuit
- Docker, if you want to host the TLSN wasm through a container

## Install the repository

### 1. Clone the repository

Clone the code first:

```bash
git clone https://github.com/JetHalo/zkp2p-demo.git
cd zkp2p-demo
```

### 2. Install workspace dependencies

This repository uses npm workspaces, so one install from the root is enough:

```bash
npm install
```

That installs the dependencies needed by `apps/web`, `apps/proof-plugin`, and `apps/tlsn-verifier`. The extension itself is static files, so it does not need a separate build.

## Start the supporting services

### 1. Start `tlsn-verifier`

Start the verifier first:

```bash
cd apps/tlsn-verifier
PORT=8080 \
CORS_ALLOW_ORIGIN=http://localhost:3011 \
npm run dev
```

Expected output:

```text
[tlsn-verifier] listening on :8080
```

Two details are worth calling out:

- The repository includes `apps/tlsn-verifier/.env.example`, but the current service code does not automatically load `.env` files. That file is better treated as a field reference or something you can feed into your own process manager.
- The verifier is responsible for validation, not proving. It returns normalized transfer fields and `wiseReceiptHash`, but it does not generate proofs for the browser.

You can verify the service is up with:

```bash
curl -sS http://localhost:8080/health
```

Expected response:

```json
{"ok":true,"service":"tlsn-verifier"}
```

### 2. Expose the Wise TLSN wasm

The repository already includes a usable `wise_plugin.tlsn.wasm`, so locally you can expose it as a static file first:

```bash
cd apps/tlsn-wasm-host
python3 -m http.server 8090
```

Once it is running, this URL should be reachable:

```text
http://localhost:8090/wise_plugin.tlsn.wasm
```

The wasm is hosted separately because `proof-plugin` handles orchestration, while the Wise-page interaction and TLS attestation logic live inside the TLSN plugin wasm. Keeping it separately hosted makes capture-rule updates more stable and easier to swap out later.

### 3. Optional: rebuild the Wise TLSN artifact

If your only goal right now is to get the project running, you can skip this section and use the wasm already in `apps/tlsn-wasm-host`.

If you want to modify the Wise-side capture rules yourself, work from `apps/tlsn-wise-plugin`:

```bash
cd apps/tlsn-wise-plugin
bash ./scripts/bootstrap-boilerplate.sh
```

That command pulls in the TLSNotary boilerplate and applies the Wise-specific project scaffold on top. After that, you need to produce your own `wise.plugin.wasm`, host it at a reachable URL, and write that URL back into `NEXT_PUBLIC_TLSN_WISE_PLUGIN_URL`.

## Configure the web app

### 1. Create `apps/web/.env.local`

This repository does not currently include `apps/web/.env.local.example`, so create `apps/web/.env.local` manually:

```dotenv
NEXT_PUBLIC_CHAIN_ID=<your_horizen_chain_id>
NEXT_PUBLIC_CONTRACT_ADDRESS=0x<your_deposit_pool_address>
NEXT_PUBLIC_BUSINESS_DOMAIN=zkp2p-horizen
NEXT_PUBLIC_TLSN_WISE_PLUGIN_URL=http://localhost:8090/wise_plugin.tlsn.wasm
NEXT_PUBLIC_INTENT_TTL_SECONDS=1800

KURIER_API_URL=https://<your-kurier-api-base>
KURIER_API_KEY=<your_kurier_api_key>
KURIER_API_ID=zkp2p
KURIER_AGGREGATION_DOMAIN_ID=175
KURIER_VK_HASH=0x<vk_hash_from_register_vk>
KURIER_PROOF_VARIANT=Plain

THEGRAPH_SUBGRAPH_URL=https://api.goldsky.com/api/public/<project_id>/subgraphs/<name>/<version>/gn
TLSN_VERIFIER_URL=http://localhost:8080/verify-wise-attestation
TLSN_ALLOWED_HOST_SUFFIXES=wise.com,transferwise.com
RPC_URL=https://horizen-testnet.rpc.caldera.xyz/http
```

The four groups of variables that most often get mixed up are:

- `NEXT_PUBLIC_TLSN_WISE_PLUGIN_URL` is browser-facing. It tells the extension where to fetch the Wise TLSN wasm.
- `TLSN_VERIFIER_URL` is for the web server. `/api/verify-wise-attestation` forwards requests there. In most cases, this proxy path is preferable to letting the browser talk to the verifier directly.
- `KURIER_API_KEY` and `KURIER_VK_HASH` should stay server-side only. Do not put them into the extension, and do not expose them as public frontend config.
- `THEGRAPH_SUBGRAPH_URL` is used by seller and commitments-related APIs. `/api/commitments` can fall back to sqlite if it is missing, but `/api/sellers` fails directly, so if you want the full seller and buyer flow working, it is better to configure it from the start.

If you do not have a subgraph URL yet, sort out your Goldsky subgraph deployment flow first. If you also want a cleaner configuration split, it helps to keep separate notes for env boundaries and the env schema so browser, server, and plugin settings do not get mixed together.

### 2. Register the verification key and capture `vkHash`

You can leave `KURIER_VK_HASH` as a placeholder in `.env.local` for now, because this step generates it.

The circuit artifacts are already committed to the repository, so VK registration does not need an extra build script. The current project uses:

- proof system: `ultrahonk`
- number of public inputs: `10`
- VK file: `circuits/zkp2p-horizen-release/noir/target/vk`

Convert the local VK file to base64 first so you do not push raw binary into JSON:

```bash
VK_BASE64="$(base64 < circuits/zkp2p-horizen-release/noir/target/vk | tr -d '\n')"
```

Then call Kurier's VK registration endpoint and store the response temporarily:

```bash
curl -sS -X POST "$KURIER_API_URL/register-vk/$KURIER_API_KEY" \
  -H 'content-type: application/json' \
  --data "{
    \"proofType\": \"ultrahonk\",
    \"vk\": \"${VK_BASE64}\",
    \"proofOptions\": {
      \"numberOfPublicInputs\": 10
    }
  }" | tee /tmp/zkp2p-vk.json
```

If registration succeeds, the response should include `vkHash` or `meta.vkHash`. Extract it with:

```bash
jq -r '.vkHash // .meta.vkHash' /tmp/zkp2p-vk.json
```

Then write that value back into `apps/web/.env.local` as `KURIER_VK_HASH`.

Two things need to stay aligned here:

- `numberOfPublicInputs` must remain `10`, matching the current circuit's public inputs: `business_domain`, `app_id`, `user_addr`, `chain_id`, `timestamp`, `intent_id`, `amount`, `wise_receipt_hash`, `nullifier`, and `statement`.
- `KURIER_PROOF_VARIANT` must match the proof style used later during proof generation and submission. If your Kurier environment requires `ZK`, switch registration, proof generation, and submission together rather than changing only one stage.

If this step fails with `proofOptions Required`, `INVALID_SUBMISSION_MODE_ERROR`, or VK-related errors, check:

- whether `KURIER_API_URL` really points to the Kurier environment you intend to use
- whether `proofType` still matches this case's `ultrahonk`
- whether `numberOfPublicInputs` still matches the circuit

### 3. Start the web app

Return to the repository root and start Next.js:

```bash
npm run dev:web
```

By default, it runs at `http://localhost:3011`.

When the page opens for the first time, the dApp also installs `window.__ZKP2P_NOIR_PROVER__` into the runtime. When the extension starts proving, it asks the current dApp page to load the Noir artifact served by `apps/web/pages/api/circuit-artifact.ts`, and then generates `proof` and `publicInputs` in the browser.

You can confirm the artifact is wired correctly with:

```bash
curl -sS "http://localhost:3011/api/circuit-artifact?name=zkp2p_horizen_release"
```

If that endpoint returns JSON, the browser prover already has the circuit artifact it needs. Because the repository already includes `circuits/zkp2p-horizen-release/noir/target/zkp2p_horizen_release.json`, the first local run does not require `nargo build`.

## Load the proof plugin

### 1. Load the unpacked extension

Open `chrome://extensions` or `edge://extensions`, then:

1. Turn on `Developer mode`
2. Click `Load unpacked`
3. Select `apps/proof-plugin`
4. Go back to `http://localhost:3011` and refresh the page

This extension does not need a separate build. `manifest.json`, `background.js`, `popup.js`, and `inpage-bridge.js` in that directory are already in a loadable development form.

### 2. Verify the extension can talk to the dApp

After you refresh, the bridge between the dApp and the extension should already be established. The flow is:

- `inpage-bridge.js` exposes the extension capability as `window.zkp2pProofPlugin`
- once the dApp calls `startProof(...)`, the extension maintains the proof session in the background
- when it reaches the proving step, the extension returns to the current dApp page and calls the already-installed `__ZKP2P_NOIR_PROVER__`

So:

- proving still happens in the browser, and the witness does not need to be sent to the server
- the extension does not need to bundle a full Noir runtime of its own, because it reuses the prover environment the dApp already prepared

## Optional: prepare contracts and on-chain tooling

If you only need the web app, plugin, and verifier running right now, you can skip this section.

### 1. Prepare deployment variables

If you want to test or deploy contracts, start with a `contracts/.env` file as your variable inventory:

```dotenv
RPC_URL=https://horizen-testnet.rpc.caldera.xyz/http
PRIVATE_KEY=0x<your_private_key>
USDC_ADDRESS=0x<existing_usdc_or_leave_blank_for_usdch>
GATEWAY_ADDRESS=0x<zkverify_aggregation_gateway_proxy>
DEPOSIT_POOL_ADDRESS=
```

The repository does not currently include a ready-made `forge script` deployment script, so this guide uses `forge create` directly. `GATEWAY_ADDRESS` is the zkVerify aggregation gateway or proxy that already exists on the target chain. This repository does not deploy it for you.

If you store the values in `contracts/.env`, export them into the current shell first:

```bash
cd contracts
set -a
source .env
set +a
```

Then derive the deployer address from the private key. You will use it later if you deploy `USDCH`:

```bash
export DEPLOYER_ADDRESS="$(cast wallet address "$PRIVATE_KEY")"
echo "$DEPLOYER_ADDRESS"
```

### 2. Run contract tests first

```bash
forge test
```

Running tests first is recommended. The core on-chain constraints for this repository live in `contracts/test/Zkp2pDepositPool.t.sol`, including buyer binding, nullifier replay protection, deadline handling, and gateway validation. It is better to expose obvious issues before deployment.

### 3. Deploy `USDCH` only if you need the demo token

If the target chain already has the 6-decimal USDC you want, fill `USDC_ADDRESS` with that address and skip this step.

If you want to use the repository's demo token, deploy `USDCH`:

```bash
forge create src/USDCH.sol:USDCH \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast \
  --constructor-args "$DEPLOYER_ADDRESS"
```

After deployment succeeds, record the deployed address and export it:

```bash
export USDC_ADDRESS=0x<deployed_usdch_address>
```

### 4. Deploy `Zkp2pDepositPool`

`Zkp2pDepositPool` has only two constructor arguments:

- `token_`: the USDC or USDCH address you prepared in the previous step
- `gateway_`: the zkVerify aggregation gateway or proxy address on the target chain

Deploy it with:

```bash
forge create src/Zkp2pDepositPool.sol:Zkp2pDepositPool \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast \
  --constructor-args "$USDC_ADDRESS" "$GATEWAY_ADDRESS"
```

After deployment succeeds, export the pool address because the web app and subgraph will both need it:

```bash
export DEPOSIT_POOL_ADDRESS=0x<deployed_pool_address>
```

### 5. Verify the deployment before wiring the frontend

Once deployment completes, use `cast call` for a basic read check before you push addresses into the frontend:

```bash
cast call "$DEPOSIT_POOL_ADDRESS" "token()(address)" --rpc-url "$RPC_URL"
cast call "$DEPOSIT_POOL_ADDRESS" "gateway()(address)" --rpc-url "$RPC_URL"
cast call "$DEPOSIT_POOL_ADDRESS" "totalDeposited()(uint256)" --rpc-url "$RPC_URL"
```

If the first two calls return your `USDC_ADDRESS` and `GATEWAY_ADDRESS`, your constructor arguments are correct.

If you deployed the repository's `USDCH`, you can also do a minimal approve + deposit smoke test:

```bash
cast send "$USDC_ADDRESS" "approve(address,uint256)" "$DEPOSIT_POOL_ADDRESS" 100000000 \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY"

cast send "$DEPOSIT_POOL_ADDRESS" "deposit(uint256)" 100000000 \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY"
```

Here `100000000` means `100` tokens with 6 decimals. After both approve and deposit succeed, write these values back into the app layer:

- `NEXT_PUBLIC_CONTRACT_ADDRESS` in `apps/web/.env.local`
- `DEPOSIT_POOL_ADDRESS` in `contracts/.env`
- `DEPOSIT_POOL_ADDRESS` in the subgraph deployment command

That write-back step matters. The frontend does not read `contracts/.env` for real deposit and release flows. It only reads the `NEXT_PUBLIC_*` values in `apps/web/.env.local`. If you update only the contract-side config, the page will still point to the old address or no address at all.

If you plan to deploy the subgraph next, you can continue with the repository's existing command:

```bash
cd ../scripts/zkp2p-horizen-release/thegraph
DEPOSIT_POOL_ADDRESS="$DEPOSIT_POOL_ADDRESS" \
DEPOSIT_POOL_START_BLOCK=<deploy_block_number> \
SUBGRAPH_NETWORK=horizen-testnet \
npm run prepare:manifest
```

## Verify the installation

At this point, run one round of basic checks:

### 1. Service checks

Confirm that all three are true:

- `curl -sS http://localhost:8080/health` returns `{"ok":true,"service":"tlsn-verifier"}`
- `http://localhost:8090/wise_plugin.tlsn.wasm` is reachable
- `http://localhost:3011/api/circuit-artifact?name=zkp2p_horizen_release` returns JSON

### 2. App checks

Open `http://localhost:3011`, then confirm:

- the page loads instead of stopping on a missing env-var error
- the extension appears in the browser extensions list
- after you start the plugin, page logs show the plugin state moving forward; if it immediately complains about `NEXT_PUBLIC_TLSN_WISE_PLUGIN_URL`, the wasm URL is still missing or wrong

If Kurier, contract addresses, and the subgraph are all wired correctly, the full flow usually moves through statuses in this order:

```text
wise_opened -> capture_ready -> proving -> proof_ready -> submitted -> verified -> aggregated
```

## Troubleshooting order

If the flow is not working, debug in this order instead of starting with wallet or contract issues:

1. Check whether `NEXT_PUBLIC_TLSN_WISE_PLUGIN_URL` and `TLSN_VERIFIER_URL` are correct.
2. Then check whether `KURIER_API_URL`, `KURIER_API_KEY`, `KURIER_VK_HASH`, and `KURIER_AGGREGATION_DOMAIN_ID` all belong to the same Kurier setup.
3. Then confirm that `THEGRAPH_SUBGRAPH_URL` and `NEXT_PUBLIC_CONTRACT_ADDRESS` point to the same deployment on the same chain.
4. If the proof is already submitted but aggregation never appears, inspect statement, tuple, and gateway precheck next.
5. Only after that should you move on to wallet signing, gas, nonce, and other chain-specific issues.
