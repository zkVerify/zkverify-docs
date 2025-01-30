---
title: Run a New Validator Node
---

## Prepare and Run

To run a new validator node (refer to [this page](../01-getting_started.md#node-types.md) for node types) the specific command-line arguments you should set are the following:

| Name        | Description                                                                                                                                                                             | Value                      |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| --validator | Enable validator mode.<br/> The node will be started with the authority role and actively participate in any consensus task that it can (e.g. depending on availability of local keys). | No value must be provided. |

Since a validator node needs proper keys for block authoring and chain selection, you can generate them using the `zkv-node` command `key` (refer to [this section](./getting_started_binaries#node-command-line-utilities) for further details).

Generate a secret phrase with:

```bash
target/production/zkv-node key generate
```

then take note of the `Secret phrase:` contained in the response and proceed with key insertion:

```bash
target/production/zkv-node key insert --key-type babe --chain test --base-path /home/your_user/validator_node_data --scheme sr25519
target/production/zkv-node key insert --key-type gran --chain test --base-path /home/your_user/validator_node_data --scheme ed25519
target/production/zkv-node key insert --key-type imon --chain test --base-path /home/your_user/validator_node_data --scheme sr25519
```

providing the secret phrase as input when prompted for (`URI:`).

You can then start with:

```bash
target/production/zkv-node --name MyZkVerifyValidatorNode --base-path /home/your_user/validator_node_data --chain test --port 30353 --validator
```

:::note
You can change the values of the above args based on your needs.
:::

You can check from the logs printed out in the console that your validator node is up and running (e.g. it keeps updating the chain tip, it is connected to other peers, it authors new blocks, etc.).

Refer to [this section](../run_using_docker/run_new_validator_node#next-steps) for the next steps you need to take after starting your validator node.
