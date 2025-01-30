---
title: Getting Started
---

## Node Types

There are three main types of nodes that users can run to participate in the **zkVerify** network:

- **RPC nodes:** can serve as local entry point for the user to interact with the blockchain.  RPC nodes also:
  - Connect to the other nodes and interact with them by sending and receiving blockchain data.
  - Maintain either a full or partial copy of the blockchain.
- **Boot nodes (or seeder nodes):** are ideal for a user who wants to contribute an entry point to the network, thereby enhancing decentralization.  They also:
  - Provide connectivity to existing nodes, making it easier for new nodes to join the network.
  - Hold minimal blockchain data.
  - Require private keys for signing peer-to-peer (p2p) messages and uniquely identifying the node within the network (peer-id).
- **Validator nodes:** actively participates in consensus, authoring new blocks and selecting the best chain.  Because of the critical role these nodes play, they earn new tokens through staking. In addition, they:
  - Maintain a complete copy of the blockchain.
  - Require specific private keys for the Babe and Grandpa consensus algorithms.
  - Require a high-security and high-availability environment.

:::tip[*Not sure which option to choose?*]

If you're uncertain about which node type suits your needs, consider starting with an RPC node. It will allow you to explore the ecosystem and gain familiarity.

:::

## Hardware Requirements

The hardware requirements are listed in the table below:

| Requirement        | RPC node           | Boot node          | Validator node     |
| ------------------ | ------------------ | ------------------ | ------------------ |
| Core               | 1                  | 1                  | 1                  |
| Threads per core   | 2                  | 2                  | 2                  |
| Clock speed (GHz)  | 2.2                | 2.2                | 2.2                |
| Memory (GiB)       | 2                  | 4                  | 2                  |
| Bandwidth (Gigabit)| Up to 5            | Up to 5            | Up to 5            |
| Storage (GB)       | 50<br/>5 with pruning| 5                | 150                |

:::note
These requirements are likely to change over time, and it's possible that nodes can run effectively on machines with lower specifications than what are laid out above.
:::

## Setup Types

There are two options to set up your node.  You can:

- **Use Docker (recommended):** which provides a convenient and consistent environment for running your node.  In addition:
  - It simplifies deployment and ensures compatibility across different platforms.
  - It is highly recommended for ease of use and maintenance.
- **Use binaries built from source:** which allows for more control over the installation process. You can build the binaries directly from the source code, available at [zkVerify](https://github.com/HorizenLabs/zkVerify).  In addition:
  - It requires manual compilation and configuration.
  - This is suitable for advanced users who want to customize their setup.
