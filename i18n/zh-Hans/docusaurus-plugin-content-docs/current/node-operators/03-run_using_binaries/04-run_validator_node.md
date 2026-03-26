---
title: 运行新验证人节点
---

## Prepare and Run

运行验证人节点（类型见 [此处](../01-getting_started.md#node-types.md)）需关注以下参数：

| Name        | Description                                                                                                                                                                             | Value                      |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| --validator | 启用验证人模式，节点以 authority 角色参与共识（取决于本地密钥是否可用）。 | 无需取值 |

验证人需出块/选链密钥，可用 `zkv-relay key` 生成（详见 [命令工具](./getting_started_binaries#node-command-line-utilities)）。

生成助记词：

```bash
target/production/zkv-relay key generate
```

记录 `Secret phrase:`，并插入密钥：

```bash
target/production/zkv-relay key insert --key-type babe --chain test --base-path /home/your_user/validator_node_data --scheme sr25519
target/production/zkv-relay key insert --key-type gran --chain test --base-path /home/your_user/validator_node_data --scheme ed25519
target/production/zkv-relay key insert --key-type imon --chain test --base-path /home/your_user/validator_node_data --scheme sr25519
```

提示 `URI:` 时输入助记词。

示例启动：

```bash
target/production/zkv-relay --name MyZkVerifyValidatorNode --base-path /home/your_user/validator_node_data --chain test --port 30353 --validator
```

:::note
可按需调整参数。
:::

通过控制台日志确认验证人节点运行（更新高度、连接 peers、出块等）。

启动后需进行注册、质押等，参考 [Docker 版后续步骤](../run_using_docker/run_new_validator_node#next-steps)。
