---
title: 运行新 Boot 节点
---

## Prepare the Environment

要运行新的 boot 节点（类型见 [此处](../01-getting_started.md#node-types.md)），进入 `compose-zkverify-simplified` 根目录：

```bash
cd compose-zkverify-simplified
```

运行初始化脚本：

```bash
scripts/init.sh
```

脚本交互将询问：

- 节点类型：选择 boot node。
- 网络：当前仅 testnet。
- 节点名：自定义标识。
- 节点密钥（`node_key.dat`）：导入已有或让脚本随机生成（见 [节点密钥说明](./01-getting_started_docker.md)）。

结束后脚本会在 `deployments/boot-node/`*`network`* 下生成文件，并提示：

```bash
=== Run the compose project with the following command:

========================
docker compose -f /home/your_user/compose-zkverify-simplified/deployments/boot-node/testnet/docker-compose.yml up -d
========================
```

启动前可编辑 `deployments/boot-node/`*`network`*`/.env` 自定义：`# Node miscellaneous` 为容器配置，`# Node config` 为 Substrate 配置。

:::warning
手动修改需理解影响。
:::

## Run the Node

**开始运行节点：**

Within the terminal type the command below which runs the Docker container:

```bash
docker compose -f /home/your_user/compose-zkverify-simplified/deployments/boot-node/testnet/docker-compose.yml up -d
```

执行后节点后台运行，检查：

```bash
docker container ls
```

and you should get something similar to:

```bash
CONTAINER ID   IMAGE                         COMMAND                CREATED              STATUS              NAMES
dab0c67cf5aa   zkverify/relay-node:latest   "/app/entrypoint.sh"   About a minute ago   Up About a minute   boot-node
```

显示如上即启动正常。

## Next Steps

需要确保节点机器配置正确：

- 绑定公网静态 IP 或 DNS
- 对外开放端口，检查 `.env` 中 `NODE_NET_P2P_PORT` 与 `NODE_NET_P2P_PORT_WS`

最后将 bootnode 信息告知其他节点：

- IP（或 DNS）
- 开放端口
- 节点公钥（peer id）：启动日志 `Local node identity is: ...` 中，或用命令 `docker run -v`*`path_to_your_file`*`/node_key.dat:/data/node_key.dat --rm --entrypoint zkv-relay zkverify/relay-node:latest key inspect-node-key --file /data/node_key.dat` 获取。

他人可将下列配置写入其 `.env` 来使用你的 bootnode。

For the IP address case:

- `ZKV_CONF_BOOTNODES="/ip4/`*`IP_ADDRESS`*`/tcp/`*`${ZKV_NODE_NET_P2P_PORT}`*`/p2p/`*`PEER_ID`*`,
- `ZKV_CONF_BOOTNODES="/ip4/`*`IP_ADDRESS`*`/tcp/`*`${ZKV_NODE_NET_P2P_PORT_WS}`*`/ws/p2p/`*`PEER_ID`*`,

DNS 示例：

- `ZKV_CONF_BOOTNODES="/dns/`*`DNS_NAME`*`/tcp/`*`${ZKV_NODE_NET_P2P_PORT}`*`/p2p/`*`PEER_ID`*`,
- `ZKV_CONF_BOOTNODES="/dns/`*`DNS_NAME`*`/tcp/`*`${ZKV_NODE_NET_P2P_PORT_WS}`*`/ws/p2p/`*`PEER_ID`*`.
