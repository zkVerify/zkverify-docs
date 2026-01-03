---
title: 二进制快速开始
---

## Prerequisites

推荐在 Linux 机器上运行 **zkVerify** 节点。

构建源码需：

- Rustup：`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- Rust 源码组件：`rustup component add rust-src`
- Wasm 目标：`rustup target add wasm32-unknown-unknown`
- `protoc`：`sudo apt install protobuf-compiler`
- `clang`：`sudo apt install clang`

查看 [releases](https://github.com/zkVerify/zkVerify/release) 获取最新 tag `latest_tag`，克隆仓库：

```bash
git clone --branch latest_tag https://github.com/zkVerify/zkVerify.git
```

:::tip[**Recommendation: use the latest tag**]
建议使用最新 tag 运行最新版本，可在 [releases](https://github.com/zkVerify/zkVerify/releases) 查找并替换（如 `latest_tag` -> `x.x.x`）。也可直接克隆 `main`，需自行权衡。
:::

该仓库是 **zkVerify** 节点实现，基于 [Substrate](https://substrate.io/)。

## Building the Binaries from Source Code

在仓库根目录执行：

```bash
cargo build -p zkv-relay --profile production
```

or:

```bash
cargo build -p zkv-relay
```

上行为发布构建，或使用调试构建：

首次构建会下载依赖，需数分钟。完成后产物在 `target/production`（或 `target/debug`），节点可执行文件为 `zkv-relay`。

如需清理旧产物：

```bash
cargo clean
```

## Node Command-Line Utilities

除运行节点外，`zkv-relay` 还提供命令工具，主要包括：

- Command `key`:
  - `generate`、`inspect`、`insert`：生成/解析/插入账户密钥（Babe、Grandpa 等），用于验证人节点。
  - `generate-node-key`、`inspect-node-key`：生成/解析节点密钥（P2P 签名与节点标识），用于 boot 节点。
  - 详见 `target/production/zkv-relay key --help`
- Command `build-spec`:
  - 生成链配置文件。
  - 详见 `target/production/zkv-relay build-spec --help`。

## Node Common Configuration

后续章节将介绍不同模式的命令参数。zkVerify 节点基于 [Substrate node template](https://docs.substrate.io/reference/command-line-tools/node-template/)，支持相同命令行参数。查看帮助：

```bash
target/production/zkv-relay --help
```

通用参数：

| Name        | Description                                                                                                                                                                                                 | Value                                                                     |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| --name      | The human-readable name for this node.<br/> It's used as network node name.                                                                                                                                 | Whatever you want.                                                        |
| --base-path | Specify custom base path.                                                                                                                                                                                   | Absolute or relative path.                                                |
| --chain     | Specify the chain specification.<br/> It can be one of the predefined ones (dev, local, or staging) or it can be a path to a file with the chainspec (such as one exported by the `build-spec` subcommand). | `mainnet` for joining **zkVerify** mainnet. <br/> `test` for joining **zkVerify** testnet.                                  |
| --port      | Specify p2p protocol TCP port                                                                                                                                                                               | Any number, but make sure the port is not already in use on your machine. |
