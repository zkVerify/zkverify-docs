---
title: Update a Running Node
---

## Procedure

To update an already running node (wheter it is an RPC node, boot node or validator node) check the [releases page](https://github.com/zkVerify/compose-zkverify-simplified/releases) and note the latest tag `latest_tag`.
Open a terminal, navigate to the root directory of project `compose-zkverify-simplified` and execute the commands:

```bash
cd compose-zkverify-simplified
git fetch
git checkout latest_tag
```

:::tip[**Recommendation: use the latest tag**]
It is recommended to use the latest tag in order to run the latest, most updated software.  Check the [releases page](https://github.com/zkVerify/compose-zkverify-simplified/releases) to find the latest tag and if needed, update accordingly the command provided above (e.g `latest_tag` -> `x.x.x`).
:::

Then launch the update script by typing:

```bash
scripts/update.sh
```

The interactive session run by the script asks you for the following inputs:

- Node type: select the type of node you are updating.
- Network: currently only testnet is available.
- Parameters to update: if some parameters cannot be automatically updated you are required to provide a new value for them.

At the end of the session the script will update the directory `deployments/`*`network`*`/`*`network`* with the proper files. You will get a message similar to the following:

```bash
=== Start the compose project with the following command: 

========================
docker compose -f /home/your_user/compose-zkverify-simplified/deployments/rpc-node/testnet/docker-compose.yml up -d --force-recreate
========================
```

Before launching the node, you can further inspect and customize the execution by manually editing `deployments/`*`network`*`/`*`network`*`/.env` file.

:::warning
Ensure that you fully understand the implications of customizing the execution manually if you choose to do so.
:::

Within the terminal type the command suggested by the script in order to complete the update process. Note that the no shut-down operation is required because the entire restart procedure is handled by Docker.

Check the new image version is being used by typing `docker container ls`.
