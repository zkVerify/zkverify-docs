---
title: Run a New RPC Node
---

## Prepare and Run

To run a new RPC node (refer to [this page](../01-getting_started.md#node-types.md) for node types) the specific command-line arguments you should set are the following:

| Name            | Description                                                                                                                                                                                                 | Value                                                                     |
| -------------   | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| --rpc-port      | Specify JSON-RPC server TCP port.                                                                                                                                                                           | Any number, but make sure the port is not already in use on your machine. |
| --rpc-external  | Listen to all RPC interfaces (default: local).<br/> Not all RPC methods are safe to be exposed publicly.<br/> Use an RPC proxy server to filter out dangerous methods. More details: [https://docs.substrate.io/main-docs/build/custom-rpc/#public-rpcs](https://docs.substrate.io/main-docs/build/custom-rpc/#public-rpcs).<br/> Use `--unsafe-rpc-external` to suppress the warning if you understand the risks. | No value must be provided. |
| --rpc-cors      | Specify browser *origins* allowed to access the HTTP and WS RPC servers.<br/> A comma-separated list of origins (`protocol://domain` or special `null` value). Value of `all` will disable origin validation. Default is to allow localhost and [https://polkadot.js.org](<https://polkadot.js.org>) origins. When running in `--dev` mode the default is to allow all origins. | `all` for allowing PolkadotJS to reach the node running within the container. |
| --rpc-methods   | RPC methods to expose. <br/> [default: `auto`]<br/> Possible values:<br/> - `auto`: Expose every RPC method only when RPC is listening on `localhost`, otherwise serve only safe RPC methods<br/> - `safe`: Allow only a safe subset of RPC methods<br/> - `unsafe`: Expose every RPC method (even potentially unsafe ones) | `safe` if your machine externally exposes RPC port, otherwise `unsafe`. |
| --pruning       | Specifies the maximum number of block states to keep or archive to keep all block states. If the node is running as a validator, the default is to keep all block states. If the node does not run as a validator, only state for the last 256 blocks is kept. | `archive` if you want to maintain a full copy of the blockchain, any number if you want to keep only a specific number of recent blocks. |

You can then start with:

```bash
target/production/zkv-node --name MyZkVerifyRpcNode --base-path /home/your_user/rpc_node_data --chain test --port 30555 --rpc-port 9944 --rpc-external --rpc-cors all --rpc-methods safe --pruning archive
```

:::note
You can change the values of the above args based on your needs.
:::

You can check from the logs printed out in the console that your RPC node is up and running (e.g. it keeps updating the chain tip, it is connected to other peers, etc.).

Refer to [this section](../run_using_docker/run_new_rpc_node#explore-and-interact-with-the-node) for instructions on how to explore and interact with your RPC node.
