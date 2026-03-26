---
title: Docker 快速开始
---

预构建镜像已发布在 [DockerHub](https://hub.docker.com/r/zkverify/relay-node/tags)，适用于 `amd64`。若需其他架构（如 Apple Silicon），请参阅 [使用二进制运行](../03-run_using_binaries/01-getting_started_binaries.md)。

## Prerequisites

开始前请安装：

- Docker,
- Docker Compose (v2),
- `jq` tool,
- `gnu-sed` tool (macOS only).

In order to check Docker and Docker Compose availability, open a terminal and type:

```bash
docker --version
```

then type:

```bash
docker compose version
```

如有错误，请参考官方 [Docker](https://docs.docker.com/engine/install/) 与 [Docker Compose](https://docs.docker.com/compose/install/) 安装指南。

:::note
后续默认具备基础 Docker 知识。如不熟悉，可一边操作一边查阅资料。
:::

To check your machine for `jq` tool availability, open a terminal and type:

```bash
jq --version
```

若 `jq` 不可用，可安装：

- Linux: command `sudo apt install jq`,
- macOS: command `brew install jq`,
- Windows: download it from the [official GitHub release page](https://github.com/jqlang/jq/releases/), rename the executable as `jq.exe` and save it in a directory that's part of your system's `PATH` (e.g. `C:\Windows\System32` or `C:\Windows`).

检查 `gnu-sed`（macOS）：

```bash
gsed --version
```

If the command results in an error, you can install `gnu-sed` with:

```bash
brew install gsed
```
查看 [releases](https://github.com/zkVerify/compose-zkverify-simplified/releases) 获取最新 tag `latest_tag`，克隆：

```bash
git clone --branch latest_tag https://github.com/zkVerify/compose-zkverify-simplified.git
```

或直接下载 [压缩包](https://github.com/zkVerify/compose-zkverify-simplified/releases) 并解压。

:::tip[**Recommendation: use the latest tag**]
建议使用最新 tag 运行最新软件，可在 [releases](https://github.com/zkVerify/compose-zkverify-simplified/releases) 查看（如将 `latest_tag` 替换为具体版本）。
:::

该仓库包含准备环境所需的脚本与资源。

## Basic Items

仓库内的 `scripts/init.sh` 是主要工具，引导收集配置并生成所需文件。

:::tip[**For Windows users**]
运行 `scripts/init.sh` 前建议：

- Make sure Docker engine is running (e.g. verifying it from Docker Desktop),
- Make sure you can run `.sh` scripts on your machine
  - The suggested option is to install [Git](https://git-scm.com/downloads/win)
  - Then you can just double click on `init.sh` or use Git Bash tool.

:::

以下是运行节点所需的基础项：

- The Docker image `zkverify/relay-node`:
  - **zkVerify** 已打包成镜像，跨平台一致运行。
  - 推荐 tag 为 `latest`，或在 DockerHub 选择其他。
  - 若本地无镜像，Docker Compose 会自动拉取。
  - 也可用 [`hl-node.Dockerfile`](https://github.com/zkVerify/zkVerify/blob/main/docker/dockerfiles/hl-node.Dockerfile) 自行构建。
- Docker Compose file:
  - 通用模板用于启动节点。
  - 由 `init.sh` 自动生成。
- `.env` file:
  - 节点配置文件，由 `init.sh` 自动生成。
- Secret files:
  - `secret_phrase.dat`：12 词助记词，用于生成出块/终结所需密钥（仅验证人）。
  - `node_key.dat`：随机 256 位数，签名 P2P 消息并标识节点（peer-id）。
  - 均由 `init.sh` 自动生成。
