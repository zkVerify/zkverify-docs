---
title: 运行新 RPC 节点
---

## Prepare and Run

运行 RPC 节点（节点类型见 [此处](../01-getting_started.md#node-types.md)）需关注以下参数：

| Name           | Description                                                                                                                                                                                                                                                                                                                                                                                                        | Value                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| --rpc-port     | RPC 端口                                                                                                                                                                                                                                                                                                                                                                                  | 任意未占用端口                                                                |
| --rpc-external | 监听全部 RPC 接口（默认仅本地）。并非所有 RPC 方法安全公开，可用代理过滤；了解风险可用 `--unsafe-rpc-external` 消除警告。详见 [public RPCs](https://docs.substrate.io/main-docs/build/custom-rpc/#public-rpcs)。 | 无需取值                                                                                                               |
| --rpc-cors     | 允许访问 HTTP/WS RPC 的浏览器源，逗号分隔；`all` 关闭校验。默认允许 localhost 与 https://polkadot.js.org；`--dev` 默认允许全部。                                    | `all`（方便 PolkadotJS 访问）                                                           |
| --rpc-methods  | 暴露的 RPC 方法，默认 `auto`；`auto`：仅本地时全开，否则仅安全方法；`safe`：仅安全子集；`unsafe`：全部（含潜在危险）。                                                                                        | 对外开放端口时用 `safe`，否则 `unsafe`                                                                 |
| --pruning      | 状态保留数量或 `archive` 保留全量。验证人默认全量，非验证人默认仅保留最近 256 块。                                                                                                                                                                                                                                                                                     | 全量用 `archive`，或指定保留块数 |

示例启动：

```bash
target/production/zkv-relay --name MyZkVerifyRpcNode --base-path /home/your_user/rpc_node_data --chain test --port 30555 --rpc-port 9944 --rpc-external --rpc-cors all --rpc-methods safe --pruning archive
```

:::note
可按需调整参数值。
:::

可通过控制台日志确认节点在运行（更新链高度、已连接 peers 等）。

如何探索与交互可参考 [Docker 版说明](../run_using_docker/run_new_rpc_node#explore-and-interact-with-the-node)。
