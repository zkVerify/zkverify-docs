---
title: Using Seeder sevice backups
---

This document explains how to use the daily snapshots provided by the Seeder Service to bootstrap your own zkVerify node more quickly. By using a pre-synced `db` directory, you can skip the initial sync process and start your node from an up-to-date chain state.

## 📦 What Are These Snapshots?

Each snapshot is a `.tar.gz` archive containing the `db` directory of a node's chain data. **Two types are available**, both updated **daily**:

* `node-snapshot_YYYY-MM-DD_HHMM.tar.gz`: snapshot from a **full node** (default pruning)
* `archive-node-snapshot_YYYY-MM-DD_HHMM.tar.gz`: snapshot from an **archive node** (no pruning)

These snapshots are meant to replace the contents of the `db` directory under your node’s Docker volume.

## 🌐 Where to Download

Snapshots are publicly available at:

👉 **[https://bootstraps.zkverify.io](https://bootstraps.zkverify.io)**

## 🚀 How to Use

In the following example, we are applying the snapshot to an RPC node. Note that the commands below will vary depending on the kind of *NODE* you are running, your *local setup*, and *Docker environment*.

1. **Initialize and start the node**, following the official documentation for [`zkVerify/compose-zkverify-simplified`](https://github.com/zkVerify/compose-zkverify-simplified).

2. **Stop the container**:
   Use the same command provided at the end of the initialization, replacing `up -d` with `stop`:

   ```bash
   docker compose -f /home/user1/compose-zkverify-simplified/deployments/rpc-node/testnet/docker-compose.yml stop
   ```

3. **Locate the Docker volume** used by your node:
   Use `docker volume ls` to list volumes. The volume name should match one of the following based on node type:

   * `zkverify-rpc-testnet_node-data` --> *Used in this example*
   * `zkverify-validator-testnet_node-data`
   * `zkverify-boot-testnet_node-data`

4. **Identify the full path and permissions for the `db` directory**:

   ```bash
   docker volume inspect zkverify-rpc-testnet_node-data -f '{{ .Mountpoint }}'
   ```

   The mountpoint will look like:

   ```bash
   /var/lib/docker/volumes/zkverify-rpc-testnet_node-data/_data
   ```

   So the full path for the db directory will be:

   ```bash
   /var/lib/docker/volumes/zkverify-rpc-testnet_node-data/_data/node/chains/zkv_testnet/db
   ```

   Make note of the original ownership/permissions of the `db` directory:

   ```bash
   stat -c "%u:%g" /var/lib/docker/volumes/zkverify-rpc-testnet_node-data/_data/node/chains/zkv_testnet/db
   ```

5. **Extract and replace the `db` directory**:
   Remove the existing `db` directory:

   ```bash
   sudo rm -rf /var/lib/docker/volumes/zkverify-rpc-testnet_node-data/_data/node/chains/zkv_testnet/db
   ```

   Extract the snapshot archive into the parent directory:

   ```bash
   sudo tar -xvzf <snapshot-file>.tar.gz -C /var/lib/docker/volumes/zkverify-rpc-testnet_node-data/_data/node/chains/zkv_testnet/
   ```

6. **Fix permissions if necessary**:
   Ensure the new `db` directory has the correct ownership:

   ```bash
   sudo chown -R <user>:<group> /var/lib/docker/volumes/zkverify-rpc-testnet_node-data/_data/node/chains/zkv_testnet/db
   ```

7. **Start your node again using the same docker compose command from before**:

   ```bash
   docker compose -f /home/user1/compose-zkverify-simplified/deployments/rpc-node/testnet/docker-compose.yml up -d
   ```

## 🛠️ Notes

* ✅ After initializing your node for the first time, always stop it before replacing the `db` directory.
* ⚠️ Make note of the original ownership/permissions of the `/data/db` directory before replacing it, and apply the same to the new `db` directory after extracting.
* 🗂️ The archive contains only the `db` directory. Your current `keystore` and `network` directories will be preserved.