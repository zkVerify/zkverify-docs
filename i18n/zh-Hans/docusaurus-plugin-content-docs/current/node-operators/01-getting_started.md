---
title: 快速开始
---

## Node Types

用户可运行三类节点参与 **zkVerify** 网络：

- **RPC 节点：** 本地入口用于与链交互；连接其他节点收发数据；可维护全量或部分链数据。
- **Boot 节点（Seeder）：** 作为网络入口提升去中心化；为新节点提供连通；仅保留最少链数据；需用于签名 P2P 消息并标识节点的私钥（peer-id）。
- **验证人节点：** 参与共识、出块、选链；通过质押获得奖励；维护完整链数据；需 Babe/Grandpa 专用私钥；需要高安全高可用环境。

:::tip[*Not sure which option to choose?*]

不确定选择哪种？可先部署 RPC 节点，熟悉生态后再切换。

:::

## Hardware Requirements

硬件需求如下：

| Requirement           | RPC node                                  | Boot node | Validator node |
|-----------------------|-------------------------------------------|-----------|----------------|
| Core                  | 4                                         | 4         | 8              |
| Threads per core      | 2                                         | 2         | 2              |
| Clock speed (GHz)     | ≥ 2.5                                     | ≥ 2.2     | ≥ 3.5          |
| Memory (GiB)          | 16                                        | 16        | 32             |
| Bandwidth (Gbps)      | ≥ 1                                       | ≥ 1       | ≥ 1            |
| Storage Fast NVMe(GB) | ≥ 500 (archive)<br/> ≥ 200 (with pruning) | ≥ 100     | ≥ 500          |

:::note
配置可能随时间调整，低配机器亦可能可行。
:::

## Setup Types

两种部署方式：

- **Docker（推荐）：** 环境一致、易部署、跨平台兼容，维护简单。
- **源码构建二进制：** 自行编译配置，适合需自定义的高级用户；源码见 [zkVerify](https://github.com/zkVerify/zkVerify)。

## Optional: ZKV Node Data Snapshots

为缩短启动时间，可使用每日链数据快照，见 [此处](https://bootstraps.zkverify.io)。

快照有两类：

- **Node snapshot**
- **Archive node snapshot**

每个快照为包含 **db** 目录的 **.tar.gz**，可替换初次运行生成的 **db**。
