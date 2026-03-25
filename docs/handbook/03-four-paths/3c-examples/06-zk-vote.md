---
title: "zkVote"
sidebar_position: 7
---

# Set Up a zkVote Development Environment

If you want to install while reading the code at the same time, start from the [zkvote](https://github.com/JetHalo/zkvote) repository.

## First, understand what zkVote is

zkVote is best understood as a full anonymous-voting reference system. A project can create proposals, users obtain voting eligibility first, and then vote anonymously. The system checks whether you are eligible to vote and records whether the verification flow completed successfully, without directly binding wallet addresses to vote choices.

At a high level, the project has four major parts. `zkvote-console` is the app you actually open and use. `VotingPass` and `ProposalRegistry` are the on-chain pieces, one for voting eligibility and one for proposal registration. `PostgreSQL` stores application records. `Goldsky`, `IPFS`, and `zkVerify` are the supporting services that restore chain events, store proposal bodies, and track proof status.

## Prerequisite

- Node.js 20+
- npm 10+
- PostgreSQL 14+, used to store memberships, proof records, vote records, and proposal metadata URIs
- MetaMask or another EVM-compatible wallet for real minting and proposal creation
- Foundry, only if you plan to deploy contracts yourself
- A Goldsky account and CLI, only if you plan to index chain events
- zkVerify RPC, WebSocket, and a signing account, only if you plan to use the real proof submission path

## What you'll learn

By the end of this tutorial, you will have an environment you can keep developing on, and you will understand:

- how to install the full repository dependencies and start `zkvote-console`
- why the database should be connected first, and what mode the project falls back to without one
- what `VotingPass`, `ProposalRegistry`, Goldsky, IPFS, and zkVerify each do in the full flow
- which services are optional while you are just getting the app running, and which become mandatory once you move into real end-to-end integration

## Supporting services at a glance

| Component | Recommended from the start? | Responsibility | Why it is designed this way |
| --- | --- | --- | --- |
| PostgreSQL | Yes | Stores memberships, proofs, votes, and proposal metadata URIs | These are application-state records and do not belong on-chain. Without a database, the service falls back to an in-memory repository and loses state after restart. |
| `VotingPass` contract | Required for real minting | Mints the voting-eligibility NFT | Keeping the eligibility credential in its own contract is clearer than embedding it into the proposal contract, and it gives the frontend a clean way to check whether a user can vote. |
| `ProposalRegistry` contract | Required for real proposal creation | Stores proposal skeletons, time windows, snapshot block height, and `metadataUri` | The contract keeps only the minimal on-chain facts needed for voting. Proposal body content stays off-chain to reduce gas and storage cost. |
| Goldsky Subgraph | Optional for local demos, strongly recommended for integration and restart recovery | Indexes events such as `VotingPass.Transfer`, `ProposalCreated`, and `GroupRootSet` | After an app restart, you need a read model that can reconstruct chain facts. Otherwise you only see what is still in the local database. |
| IPFS pinning + gateway | Recommended if you want proposals that can be recovered later | Stores proposal bodies and returns `ipfs://...` | Proposal title, description, and options do not belong fully on-chain. Keeping only `metadataUri` and hashes on-chain is more robust. |
| zkVerify | Optional for local UI work, required for the real proof submission path | Receives Groth16 verification tasks and returns status | The project can use a local fallback to exercise UI, APIs, and state transitions first, then switch to the real verification network once the flow is stable. |

## Install the project

1. ### Get the code and install workspace dependencies

   In an empty directory, run:

   ```bash
   git clone https://github.com/JetHalo/zkvote.git
   cd zkvote
   npm install
   ```

   Run this from the repository root because the project uses npm workspaces. Root-level `npm install` resolves dependencies for both `apps/web` and `apps/zkvotefront/zkvote-console`, and everything you do later, whether frontend, database scripts, or subgraph builds, depends on that shared workspace install.

2. ### Copy the environment templates

   Copy out the two template files first:

   ```bash
   cp apps/zkvotefront/zkvote-console/.env.local.example apps/zkvotefront/zkvote-console/.env.local
   cp contracts/.env.example contracts/.env
   ```

   `apps/zkvotefront/zkvote-console/.env.local` is for app runtime configuration, while `contracts/.env` is for chain and account configuration used during contract deployment. Keeping them separate matters: the first one is consumed by Next.js and server APIs, while the second one should stay deployment-only and should not leak private keys into the app runtime.

   If you want to boot with the current default chain path first, fill at least these values:

   ```bash
   # apps/zkvotefront/zkvote-console/.env.local
   NEXT_PUBLIC_CHAIN_NAME=Horizen Testnet
   NEXT_PUBLIC_CHAIN_ID=2651420
   NEXT_PUBLIC_RPC_URL=https://horizen-testnet.rpc.caldera.xyz/http
   DATABASE_URL=postgresql://YOUR_DB_USER@localhost:5432/zkvote
   NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=
   NEXT_PUBLIC_PROPOSAL_REGISTRY_ADDRESS=
   ```

   If you plan to deploy contracts later, align `contracts/.env` to the same chain now so the frontend and deployment scripts do not drift onto different networks:

   ```bash
   # contracts/.env
   PRIVATE_KEY=
   RPC_URL=https://horizen-testnet.rpc.caldera.xyz/http
   CHAIN_ID=2651420
   NFT_PASS_ADDRESS=
   PROPOSAL_REGISTRY_ADDRESS=
   ```

3. ### Install and configure a wallet extension

   Supporting service: browser wallet extension

   Any EVM-compatible browser wallet works, with MetaMask as the most common choice. The frontend uses injected `window.ethereum` to connect, switch chains, mint, and call `createProposal`, so a CLI private key alone is not enough.

   After installing the wallet, create or import an account and make sure it is already on `Horizen Testnet`. If the wallet does not have that chain yet, add it manually:

   ```text
   Network Name: Horizen Testnet
   RPC URL: https://horizen-testnet.rpc.caldera.xyz/http
   Chain ID: 2651420
   Currency Symbol: ETH
   Block Explorer URL: https://horizen-testnet.explorer.caldera.xyz
   ```

   You can also open the app first and connect the wallet there. The frontend will try to add the chain using the `NEXT_PUBLIC_CHAIN_*` values from `.env.local`.

4. ### Prepare PostgreSQL and initialize the schema

   Supporting service: PostgreSQL

   Create the database first:

   ```bash
   createdb zkvote
   ```

   Then run the init script from the repository root:

   ```bash
   DATABASE_URL=postgresql://YOUR_DB_USER@localhost:5432/zkvote npm run db:init --workspace zkvote-console
   ```

   Expected output:

   ```text
   Database schema applied.
   ```

   `DATABASE_URL` is written inline here on purpose because `db:init` is a plain Node script. Unlike `next dev`, it does not automatically read `.env.local`. Its job is only to apply the schema in `apps/zkvotefront/zkvote-console/db/schema.sql` so vote-related application data has somewhere to live.

   If you skip this step, the app can still start, but it falls back to an in-memory repository. That is fine for quick UI checks and bad for ongoing development, because memberships, proofs, votes, and proposal metadata disappear on restart.

5. ### Start the local app

   Run this from the repository root:

   ```bash
   npm run dev --workspace zkvote-console -- --hostname 0.0.0.0 --port 3101
   ```

   Open [http://localhost:3101](http://localhost:3101).

   You can also check runtime configuration immediately:

   ```bash
   curl http://localhost:3101/api/config
   ```

   If PostgreSQL is connected, the returned `config` should at least contain:

   ```json
   {
     "serviceMode": "postgresql",
     "goldskyConfigured": false,
     "zkVerifyConfigured": false
   }
   ```

   At this point you are only proving the app itself can run. Even without deployed contracts or Goldsky, you can already validate the page, APIs, and local state handling. Getting the minimum system running first makes later chain and service debugging much easier.

6. ### Start an IPFS mock if you need to test proposal metadata locally

   Supporting service: IPFS pinning API + gateway

   In another terminal, run:

   ```bash
   npm run ipfs:mock --workspace zkvote-console
   ```

   Expected output includes:

   ```text
   mock-ipfs listening on http://127.0.0.1:8787
   pin endpoint: http://127.0.0.1:8787/pin
   gateway base: http://127.0.0.1:8787/ipfs
   ```

   Then write these two values into `apps/zkvotefront/zkvote-console/.env.local`:

   ```bash
   NEXT_PUBLIC_IPFS_GATEWAY_URL=http://127.0.0.1:8787/ipfs
   IPFS_API_URL=http://127.0.0.1:8787/pin
   ```

   Proposal body content in this project is not pushed on-chain in full. The chain keeps `metadataUri` and related hashes, while the actual body lives in content-addressed storage such as IPFS. That lets `ProposalRegistry` store only the structured facts the voting system must know, while the readable proposal content stays off-chain, which is cheaper and easier to recover.

   During development, the local mock exists so you can exercise the full path of "upload proposal metadata -> get an `ipfs://...` URI -> read it back through the gateway" without depending on an external pinning service from day one.

7. ### Deploy `VotingPass` and `ProposalRegistry` if you need real on-chain interaction

   Supporting service: Foundry + Horizen Testnet RPC + deployment wallet

   Do not skip around in this step. Check tools first, then wallet, then compile, then deploy, and only then write addresses back into the frontend. When something breaks, that order makes it obvious where it broke.

   If Foundry is not installed yet, install it first:

   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   forge --version
   cast --version
   ```

   The two most important Foundry commands here are `forge` and `cast`. The first handles compile and deploy, the second reads balances, resolves addresses, and calls contracts. You want both working before deployment and verification.

   Next, prepare `contracts/.env`. For consistency with the repository template, `PRIVATE_KEY` should be a hex private key without `0x`:

   ```bash
   PRIVATE_KEY=YOUR_PRIVATE_KEY_WITHOUT_0X
   RPC_URL=https://horizen-testnet.rpc.caldera.xyz/http
   CHAIN_ID=2651420
   NFT_PASS_ADDRESS=
   PROPOSAL_REGISTRY_ADDRESS=
   ```

   Then enter the contracts directory, load the env, and inspect the deployment account:

   ```bash
   cd contracts
   set -a
   source .env
   set +a

   cast wallet address --private-key "$PRIVATE_KEY"
   cast balance "$(cast wallet address --private-key "$PRIVATE_KEY")" --rpc-url "$RPC_URL"
   ```

   Checking the address and balance first catches the two most common problems: the wrong private key, or an account with no testnet gas. Deployment results are meaningless until the deployer account itself is valid.

   Now compile once:

   ```bash
   forge build
   ```

   `VotingPass` has three constructor arguments: `name`, `symbol`, and `baseTokenURI`. `ProposalRegistry` has none. That distinction matters because the frontend and subgraph consume both contracts later, but they have very different chain responsibilities:

   - `VotingPass` issues the voting-eligibility NFT, and the frontend calls its `mint()`
   - `ProposalRegistry` stores proposal skeletons, and the frontend calls its `createProposal(...)`

   Deploy `VotingPass` first:

   ```bash
   forge create src/VotingPass.sol:VotingPass \
     --rpc-url "$RPC_URL" \
     --private-key "$PRIVATE_KEY" \
     --broadcast \
     --constructor-args "zkVote Pass" "ZKPASS" "ipfs://zkvote-pass/"
   ```

   Record both the contract address and the transaction hash from the output. The transaction hash matters later when you set Goldsky `startBlock`.

   Then deploy `ProposalRegistry`:

   ```bash
   forge create src/ProposalRegistry.sol:ProposalRegistry \
     --rpc-url "$RPC_URL" \
     --private-key "$PRIVATE_KEY" \
     --broadcast
   ```

   Once both contracts are deployed, do a read check before touching the frontend. Do not paste addresses into the app until chain reads confirm the contracts are the ones you just deployed:

   ```bash
   cast call "$NFT_PASS_ADDRESS" "name()(string)" --rpc-url "$RPC_URL"
   cast call "$NFT_PASS_ADDRESS" "symbol()(string)" --rpc-url "$RPC_URL"
   cast call "$PROPOSAL_REGISTRY_ADDRESS" "nextProposalId()(uint256)" --rpc-url "$RPC_URL"
   ```

   If you want to go one step further, mint one pass directly from the CLI:

   ```bash
   cast send "$NFT_PASS_ADDRESS" "mint()" \
     --rpc-url "$RPC_URL" \
     --private-key "$PRIVATE_KEY"
   ```

   Then confirm balance and owner:

   ```bash
   DEPLOYER=$(cast wallet address --private-key "$PRIVATE_KEY")
   cast call "$NFT_PASS_ADDRESS" "balanceOf(address)(uint256)" "$DEPLOYER" --rpc-url "$RPC_URL"
   cast call "$NFT_PASS_ADDRESS" "ownerOf(uint256)(address)" 1 --rpc-url "$RPC_URL"
   ```

   Finally, write the addresses back into both config files:

   ```bash
   # contracts/.env
   NFT_PASS_ADDRESS=0x...
   PROPOSAL_REGISTRY_ADDRESS=0x...

   # apps/zkvotefront/zkvote-console/.env.local
   NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
   NEXT_PUBLIC_PROPOSAL_REGISTRY_ADDRESS=0x...
   ```

   That write-back is critical. The frontend does not read `contracts/.env` for live minting or proposal creation. It only reads the `NEXT_PUBLIC_*` addresses in `apps/zkvotefront/zkvote-console/.env.local`. If you update only the contracts directory, the page still points to the old address or an empty one.

8. ### Deploy a Goldsky subgraph if you need chain facts to recover after restart

   Supporting service: Goldsky CLI + Graph CLI

   Break this step into four parts: install CLI, prepare the manifest, run local codegen/build, then deploy remotely. When Goldsky deployment fails, the problem is usually isolated to one of those four layers.

   If Goldsky CLI is not installed yet:

   ```bash
   curl https://goldsky.com | sh
   goldsky --version
   goldsky login
   ```

   Local subgraph builds also require `@graphprotocol/graph-cli`, but this repository already lists it in `subgraphs/zkvote/package.json`, so you do not need a global install. Just install dependencies inside the subgraph directory:

   ```bash
   cd subgraphs/zkvote
   npm install
   ```

   Then update `subgraph.yaml`. The repository already includes a runnable scaffold, but every time you redeploy contracts you should sync these four values:

   - `VotingPass.source.address`
   - `VotingPass.source.startBlock`
   - `ProposalRegistry.source.address`
   - `ProposalRegistry.source.startBlock`

   `address` is straightforward: use the two contract addresses you just deployed. For `startBlock`, use the actual deployment block rather than the current chain height. The reason is simple: the subgraph replays events starting from `startBlock`. Too early means scanning a lot of useless blocks. Too late means missing the earliest deployment events.

   If you saved the deployment transaction hashes, fetch the block numbers with `cast receipt`:

   ```bash
   cast receipt <VOTING_PASS_DEPLOY_TX_HASH> --rpc-url https://horizen-testnet.rpc.caldera.xyz/http
   cast receipt <PROPOSAL_REGISTRY_DEPLOY_TX_HASH> --rpc-url https://horizen-testnet.rpc.caldera.xyz/http
   ```

   Take the `blockNumber` values from those receipts and put them into `startBlock`. A readable example looks like this:

   ```yaml
   dataSources:
     - kind: ethereum
       name: VotingPass
       network: horizen-testnet
       source:
         address: "0xYourVotingPassAddress"
         abi: VotingPass
         startBlock: 12345678
   ```

   After updating the manifest, generate types locally and build locally:

   ```bash
   npm run codegen
   npm run build
   ```

   Those two local steps matter because most subgraph failures are not really about Goldsky. They come from a bad ABI, schema, mapping, or `subgraph.yaml`. If `codegen` and `build` pass locally, remote deployment is reduced to auth and upload.

   Once local build passes, deploy remotely:

   ```bash
   goldsky subgraph deploy zkvote-horizen-testnet/1.0.0 --path .
   ```

   That uploads the subgraph source from the current directory and returns a query endpoint. Write it back into the app config:

   ```bash
   # apps/zkvotefront/zkvote-console/.env.local
   GOLDSKY_SUBGRAPH_URL=https://api.goldsky.com/api/public/<project>/subgraphs/zkvote-horizen-testnet/1.0.0/gn
   ```

   After that, restart the dev server and query:

   ```bash
   curl http://localhost:3101/api/config
   ```

   If `goldskyConfigured` becomes `true`, the app is now using Goldsky as its chain read model. Goldsky does not replace PostgreSQL. It fills in the "what happened on-chain" layer. The database still stores memberships, proofs, and votes. Goldsky stores indexed events such as `Transfer`, `ProposalCreated`, and `GroupRootSet`. You need both layers for clean recovery after restart.

9. ### Connect zkVerify if you need the real proof submission path

   Supporting service: zkVerify

   Put the zkVerify variables into `apps/zkvotefront/zkvote-console/.env.local`:

   ```bash
   ZKVERIFY_RPC_URL=...
   ZKVERIFY_WS_URL=...
   ZKVERIFY_NETWORK=Volta
   ZKVERIFY_MNEMONIC=...
   ```

   These values map to zkVerify's RPC endpoint, event subscription endpoint, target network, and the account used to submit verification transactions. The project already wires `zkverifyjs` into the server adapter layer, so you only need to provide connection details here rather than writing more code.

   The underlying behavior is worth understanding. The browser generates a Semaphore Groth16 proof, then the server submits it to zkVerify and tracks the state progression `pending -> includedInBlock -> finalized`. As long as these env vars are incomplete, the project falls back to a local adapter that simulates status changes over deterministic time, which lets you finish UI, API, and state-flow work before the real network is connected.

10. ### Do one final check

   After restarting the dev service, inspect config one more time:

   ```bash
   curl http://localhost:3101/api/config
   ```

   These signals tell you which stage your environment is currently at:

   - `serviceMode: postgresql` means the database is connected
   - `goldskyConfigured: true` means the chain read model is connected
   - `zkVerifyConfigured: true` means the real proof submission path is connected
   - `ipfsConfigured: true` means proposal metadata upload is connected

   Finish with one more round of basic verification:

   ```bash
   npm run test --workspace zkvote-console
   npm run typecheck --workspace zkvote-console
   ```
