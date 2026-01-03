---
title: 更新运行中的节点
---

## Procedure


更新已运行的节点（RPC/boot/验证人）：查看 [releases](https://github.com/zkVerify/compose-zkverify-simplified/releases) 记录最新 tag `latest_tag`，在 `zkVerify` 根目录执行：

```bash
cd zkVerify
git fetch
git checkout latest_tag
```

:::tip[**Recommendation: use the latest tag**]
建议使用最新 tag 运行最新版本，可在 [releases](https://github.com/zkVerify/compose-zkverify-simplified/releases) 查找并替换（如 `latest_tag` -> `x.x.x`）。
:::

切换新版本后构建：

```bash
cargo build -p mainchain --profile production
```

构建完成后，`ctrl+c` 停止当前节点，用相同参数重新运行 `target/production/zkv-relay`。

查看日志开头 `✌️  version` 确认新版本生效。
