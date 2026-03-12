---
title: "Tutorial: Operations Only"
sidebar_position: 5
---

# ZK Escrow Hands-on Tutorial: Operations Only

> Objective: Step through commands to run the project from local setup to Base Sepolia, completing `deposit -> prove -> Kurier aggregation -> finalize`.
> This document covers operations only, not source-code internals.
> Project repository: [JetHalo/zk-Escrow](https://github.com/JetHalo/zk-Escrow)

---

## 0. Lock the mode first

This tutorial is fixed to:

- Submission mode: `aggregation-kurier`
- Verification route: `aggregation-gateway` (the contract calls `zkVerify.verifyProofAggregation`)
- Indexer strategy: `thegraph`

Do not mix direct/aggregation modes in the same branch.

---

## 1. Prepare the environment

### 1.0 Get the project code

```bash
git clone https://github.com/JetHalo/zk-Escrow.git
cd zk-Escrow
export REPO_ROOT=$(pwd)
```

### 1.1 Required tools

```bash
# Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup
forge --version
cast --version

# Node + npm
node -v
npm -v

# snarkjs
npm i -g snarkjs
snarkjs --help

# circom
circom --help
```

### 1.2 Install dependencies

```bash
cd "$REPO_ROOT/apps/web"
npm install

cd "$REPO_ROOT/contracts"
forge install

cd "$REPO_ROOT/circuits/escrow"
npm install
```

---

## 2. Configure environment variables

### 2.1 `contracts/.env`

```dotenv
PRIVATE_KEY=0x...
RPC_URL=https://base-sepolia.g.alchemy.com/v2/...

# zkVerify Base Sepolia gateway proxy
ZKVERIFY_PROXY=0xEA0A0f1EfB1088F4ff0Def03741Cb2C64F89361E

# vk hash (obtained after vkey registration)
VK_HASH=0x...

# Business domain (the circuit domain)
DOMAIN=1
APP_ID=1
CHAIN_ID=84532

# Fill this after deploying hasher
HASHER_ADDRESS=0x...
```

### 2.2 `apps/web/.env.local`

```dotenv
KURIER_API_URL=https://api-testnet.kurier.xyz/api/v1
KURIER_API_KEY=...
KURIER_VKEY_PATH=public/zk/escrow/vkey.json
KURIER_VK_HASH=0x...

NEXT_PUBLIC_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/...
NEXT_PUBLIC_DOMAIN=1
NEXT_PUBLIC_APP_ID=1
NEXT_PUBLIC_DEPLOY_BLOCK=...

# Aggregation domain (not the business DOMAIN)
KURIER_ZKVERIFY_DOMAIN_ID=2
NEXT_PUBLIC_KURIER_ZKVERIFY_DOMAIN_ID=2

# Recommended: allow on-chain precheck at aggregation stage
NEXT_PUBLIC_KURIER_REQUIRE_FINALIZED=false

# The Graph
INDEXER_STRATEGY=thegraph
THEGRAPH_SUBGRAPH_URL=https://api.studio.thegraph.com/query/.../escrow-base-sepolia-aggregation/v.0.1
NEXT_PUBLIC_THEGRAPH_SUBGRAPH_URL=https://api.studio.thegraph.com/query/.../escrow-base-sepolia-aggregation/v.0.1
```

---

## 3. Build circuit artifacts (wasm/zkey/vkey)

```bash
cd "$REPO_ROOT/circuits/escrow/circom"
mkdir -p build

# 1) Compile
circom escrowRelease.circom --r1cs --wasm --sym -o build

# 2) ptau (first time only)
snarkjs powersoftau new bn128 16 build/pot16_0000.ptau -v
snarkjs powersoftau contribute build/pot16_0000.ptau build/pot16_0001.ptau --name="first" -v -e="random-entropy"
snarkjs powersoftau prepare phase2 build/pot16_0001.ptau build/pot16_final.ptau -v

# 3) zkey
snarkjs groth16 setup build/escrowRelease.r1cs build/pot16_final.ptau build/escrowRelease_0000.zkey
snarkjs zkey contribute build/escrowRelease_0000.zkey build/escrowRelease_final.zkey --name="final" -v -e="random-entropy-2"

# 4) vkey
snarkjs zkey export verificationkey build/escrowRelease_final.zkey build/vkey.json
```

Copy artifacts to the frontend static directory:

```bash
cd "$REPO_ROOT"
mkdir -p apps/web/public/zk/escrow
cp -f circuits/escrow/circom/build/escrowRelease_js/escrowRelease.wasm apps/web/public/zk/escrow/
cp -f circuits/escrow/circom/build/escrowRelease_final.zkey apps/web/public/zk/escrow/
cp -f circuits/escrow/circom/build/vkey.json apps/web/public/zk/escrow/
```

---

## 4. Register VK to Kurier

```bash
cd "$REPO_ROOT"

node - <<'NODE'
const fs = require('fs');
const vk = JSON.parse(fs.readFileSync('apps/web/public/zk/escrow/vkey.json','utf8'));
const payload = { proofType:'groth16', vk, proofOptions:{ library:'snarkjs', curve:'bn128' } };
fs.writeFileSync('/tmp/kurier-vk.json', JSON.stringify(payload));
console.log('payload saved: /tmp/kurier-vk.json');
NODE

# Ensure KURIER_API_URL / KURIER_API_KEY are available in current shell
curl -s -X POST "$KURIER_API_URL/register-vk/$KURIER_API_KEY" \
  -H "Content-Type: application/json" \
  --data @/tmp/kurier-vk.json
```

If the response returns `uniq_vk_hash`, this vk was already registered before and can be reused directly.

---

## 5. Deploy the Hasher contract

```bash
cd "$REPO_ROOT"
node scripts/compile-hasher.js

BYTECODE=$(node -p "require('./scripts/hasher.json').bytecode")
cast send --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" --create "$BYTECODE"
```

Record the `contractAddress` from output and write it back to `HASHER_ADDRESS` in `contracts/.env`.

---

## 6. Deploy the Escrow contract

```bash
cd "$REPO_ROOT/contracts"
set -a; source .env; set +a

# Note: include --broadcast and keep constructor arg order exactly
forge create --broadcast --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" \
  src/ZKEscrowRelease.sol:ZKEscrowRelease \
  --constructor-args "$ZKVERIFY_PROXY" "$VK_HASH" "$DOMAIN" "$APP_ID" "$CHAIN_ID" "$HASHER_ADDRESS"
```

Write the returned `Deployed to` address into `NEXT_PUBLIC_ESCROW_ADDRESS` in `apps/web/.env.local`.

---

## 7. Start the frontend

```bash
cd "$REPO_ROOT/apps/web"
npm run dev
```

Open `http://localhost:3000/escrow`.

---

## 8. End-to-end operation sequence

1. Connect wallet (Base Sepolia)
2. Input recipient + amount, execute `deposit`
3. Copy credential
4. Paste credential and click unlock
5. Frontend will:
   - generate proof locally
   - call `/api/submit-proof`
   - poll `/api/proof-status`
   - fetch `/api/proof-aggregation`
   - run `verifyProofAggregation` precheck
   - once conditions are met, send `finalize` transaction (wallet popup)

---

## 9. Common troubleshooting commands (by priority)

### 9.1 Check Kurier job status

```bash
curl -s "$KURIER_API_URL/job-status/$KURIER_API_KEY/$JOB_ID"
```

### 9.2 Check local API

```bash
curl -s "http://localhost:3000/api/proof-status?proofId=$JOB_ID"

curl -s -X POST "http://localhost:3000/api/proof-aggregation" \
  -H "Content-Type: application/json" \
  --data "{\"proofId\":\"$JOB_ID\"}"
```

### 9.3 Check contract binding parameters

```bash
cast call $ESCROW "vkHash()(bytes32)" --rpc-url "$RPC_URL"
cast call $ESCROW "expectedDomain()(uint256)" --rpc-url "$RPC_URL"
cast call $ESCROW "expectedAppId()(uint256)" --rpc-url "$RPC_URL"
cast call $ESCROW "expectedChainId()(uint256)" --rpc-url "$RPC_URL"
cast call $ESCROW "zkVerify()(address)" --rpc-url "$RPC_URL"
```

### 9.4 Check whether Finalized events exist

```bash
cast logs --rpc-url "$RPC_URL" \
  --address "$ESCROW" \
  --from-block "$DEPLOY_BLOCK" \
  --to-block latest \
  "Finalized(bytes32,address,uint256)"
```

---

## 10. Deploy The Graph subgraph (optional but recommended)

```bash
cd "$REPO_ROOT/indexer/subgraph"
npm install
npm run render
npm run codegen
npm run build

# token should be Studio deploy key
export GRAPH_DEPLOY_KEY=...
export SUBGRAPH_SLUG=escrow-base-sepolia-aggregation

npm run auth
npm run deploy
```

After deployment, fill the Query URL back into `THEGRAPH_SUBGRAPH_URL` and `NEXT_PUBLIC_THEGRAPH_SUBGRAPH_URL`.
