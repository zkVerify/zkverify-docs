---
title: 运行新 Boot 节点
---

## Prepare and Run

运行 boot 节点（类型见 [此处](../01-getting_started.md#node-types.md)）需关注以下参数：

| Name            | Description                                                                                                                                                                                                                                                                                                                                                                     | Value                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| --listen-addr   | 监听的 multiaddress。默认：带 `--validator` 时 `/ip4/0.0.0.0/tcp/<port>` 与 `/ip6/[::]/tcp/<port>`；否则为 `/ip4/0.0.0.0/tcp/<port>/ws` 与 `/ip6/[::]/tcp/<port>/ws`。                                                                                                                                                                          | 与对外暴露的 p2p/p2p-ws 端口匹配的地址 |
| --node-key-file | 读取 P2P 密钥的文件。按 `--node-key-type` 解析：`ed25519` 时文件需包含 32 字节或 hex 编码的 Ed25519 私钥；若文件不存在会自动生成。 | 绝对或相对路径                                                      |

可用 `zkv-relay key generate-node-key` 与 `inspect-node-key` 生成/查看节点密钥（见 [命令工具](./getting_started_binaries#node-command-line-utilities)）。

示例启动：

```bash
target/production/zkv-relay --name MyZkVerifyBootNode --base-path /home/your_user/boot_node_data --chain test --port 30333 --listen-addr /ip4/0.0.0.0/tcp/30333 --listen-addr /ip4/0.0.0.0/tcp/30334/ws
```

:::note
可按需调整参数。
:::

通过控制台日志确认 boot 节点运行（更新高度、连接 peers 等）。

启动后需对外公布信息等，请参考 [Docker 版后续步骤](../run_using_docker/run_new_boot_node#next-steps)。
