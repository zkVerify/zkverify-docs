---
title: Run a VFlow RPC Node
---

VFlow is the EVM parachain of zkVerify. A VFlow node also runs an embedded zkVerify relay-chain node, so it syncs and stores both chains.

## Network Details

| Network | EVM chain ID | Para ID | Relay chain            | Public RPC                        |
| ------- | ------------ | ------- | ---------------------- | --------------------------------- |
| Mainnet | 1408         | 1       | zkVerify mainnet       | wss://vflow-rpc.zkverify.io       |
| Testnet | 1409         | 1       | zkVerify Volta testnet | wss://vflow-volta-rpc.zkverify.io |

## Hardware Requirements

A VFlow node includes a zkVerify node, so use at least the RPC node requirements listed in [Getting Started](/node-operators/getting_started#hardware-requirements).

For an archive node, plan for at least 1000 GB of fast NVMe storage.

## Run with Docker

The [compose-vflow-simplified](https://github.com/zkVerify/compose-vflow-simplified) repository works the same way as `compose-zkverify-simplified`, so the [prerequisites](/node-operators/run_using_docker/getting_started_docker#prerequisites) are the same. Each script asks for the node type and the network.

1. Check the [releases page](https://github.com/zkVerify/compose-vflow-simplified/releases) for the latest tag and clone it:

   ```bash
   git clone --branch latest_tag https://github.com/zkVerify/compose-vflow-simplified.git
   cd compose-vflow-simplified
   ```

2. Run the initialization script:

   ```bash
   scripts/init.sh
   ```

   It asks for the node type (select `rpc-node`), the network (`mainnet` or `testnet`), whether to run an archive node and a few optional settings, then writes the deployment files under `deployments/rpc-node/`*`network`*.

3. Start the node:

   ```bash
   scripts/start.sh
   ```

   Stop it with `scripts/stop.sh`. To update to a new release, check out the latest tag and run `scripts/update.sh`.

By default the node serves Substrate and Ethereum JSON-RPC on port 9944 and uses port 30555 for P2P.

## Snapshots

Daily snapshots are available for [mainnet](https://bootstraps.zkverify.io) and [testnet](https://bootstraps.zkverify.io/volta). A VFlow node needs both the VFlow snapshot and the zkVerify relay-chain snapshot. The steps are in the [repository README](https://github.com/zkVerify/compose-vflow-simplified#optional-vflow-node-data-snapshots).
