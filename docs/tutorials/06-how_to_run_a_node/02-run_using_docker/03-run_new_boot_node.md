---
title: Run a New Boot Node
---

## Prepare the Environment

To run a new boot node (refer to [this page](../01-getting_started.md#node-types.md) for node types) open the terminal and navigate to the root directory of project `compose-zkverify-simplified`:

```bash
cd compose-zkverify-simplified
```

Then, launch the initialization script by typing:

```bash
scripts/init.sh
```

The interactive session run by the script asks you to provide the following inputs:

- Node type: you need to select boot node.
- Network: currently only testnet is available.
- Node name: just a human readable identifier.
- Node key (`node_key.dat` file): you can import an already existing key or let the script to randomly generate one for you (refer to [this page](./01-getting_started_docker.md) for node keys).

At the end of the session the script will populate the directory `deployments/boot-node/`*`network`* with the proper files and you will get the following message:

```bash
=== Run the compose project with the following command:

========================
docker compose -f /home/your_user/compose-zkverify-simplified/deployments/boot-node/testnet/docker-compose.yml up -d
========================
```

Before actually launching the node, you can further inspect and customize the execution by manually editing `deployments/boot-node/`*`network`*`/.env` file. Entries under `# Node miscellaneous` section are related to the Docker container, while those under `# Node config` section are related to the Substrate node instance.

:::warning
Ensure that you fully understand the implications of customizing the execution manually if you choose to do so.
:::

## Run the Node

**Now we'll start running the node.**

Within the terminal type the command below which runs the Docker container:

```bash
docker compose -f /home/your_user/compose-zkverify-simplified/deployments/boot-node/testnet/docker-compose.yml up -d
```

Once this command is complete, your node will begin running in the background.  To ensure that it is running properly, type:

```bash
docker container ls
```

and you should get something similar to:

```bash
CONTAINER ID   IMAGE                         COMMAND                CREATED              STATUS              NAMES
dab0c67cf5aa   horizenlabs/zkverify:latest   "/app/entrypoint.sh"   About a minute ago   Up About a minute   boot-node
```

This shows your node has started correctly.

## Next Steps

It's now time to make sure that the machine your node is running on is properly configured.  This means checking that:

- A public static IP address (or a DNS) is associated to it,
- The proper ports are externally exposed.  Check the values for configuration `NODE_NET_P2P_PORT` and `NODE_NET_P2P_PORT_WS` inside the `.env` file.

Lastly, you should notify other node operators about the existence of your bootnode.  In particular you need to provide:

- The IP address (or the DNS).
- The open ports.
- The public part of your node key (peer id).  This is printed at the startup of your node with the log `Local node identity is: ...` or is retrievable with command `docker run -v`*`path_to_your_file`*`/node_key.dat:/data/node_key.dat --rm --entrypoint zkv-node horizenlabs/zkverify:latest key inspect-node-key --file /data/node_key.dat`.

In this way others will be able to leverage your boot node to join the network by inserting these configurations into the `.env` file of their node.

For the IP address case:

- `ZKV_CONF_BOOTNODES="/ip4/`*`IP_ADDRESS`*`/tcp/`*`${ZKV_NODE_NET_P2P_PORT}`*`/p2p/`*`PEER_ID`*`,
- `ZKV_CONF_BOOTNODES="/ip4/`*`IP_ADDRESS`*`/tcp/`*`${ZKV_NODE_NET_P2P_PORT_WS}`*`/ws/p2p/`*`PEER_ID`*`,

or or the DNS case:

- `ZKV_CONF_BOOTNODES="/dns/`*`DNS_NAME`*`/tcp/`*`${ZKV_NODE_NET_P2P_PORT}`*`/p2p/`*`PEER_ID`*`,
- `ZKV_CONF_BOOTNODES="/dns/`*`DNS_NAME`*`/tcp/`*`${ZKV_NODE_NET_P2P_PORT_WS}`*`/ws/p2p/`*`PEER_ID`*`.
