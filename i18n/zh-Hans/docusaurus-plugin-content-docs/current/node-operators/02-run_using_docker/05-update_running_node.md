---
title: 更新运行中的节点
---

## Procedure

要更新已运行的节点（RPC/boot/验证人），查看 [releases](https://github.com/zkVerify/compose-zkverify-simplified/releases) 记下最新 tag `latest_tag`，在根目录执行：

```bash
cd compose-zkverify-simplified
git fetch
git checkout latest_tag
```

:::tip[**Recommendation: use the latest tag**]
建议使用最新 tag 运行最新版本，可在 [releases](https://github.com/zkVerify/compose-zkverify-simplified/releases) 查找并替换（如 `latest_tag` -> `x.x.x`）。
:::

运行更新脚本：

```bash
scripts/update.sh
```

脚本交互会询问：

- Node type：选择要更新的节点类型
- Network：当前仅 testnet
- Parameters to update：无法自动更新的参数需手动提供

结束后脚本会更新 `deployments/`*`network`*`/`*`network`*，并提示类似：

```bash
=== Start the compose project with the following command: 

========================
docker compose -f /home/your_user/compose-zkverify-simplified/deployments/rpc-node/testnet/docker-compose.yml up -d --force-recreate
========================
```

如需自定义，可手动编辑 `deployments/`*`network`*`/`*`network`*`/.env`。

:::warning
手动修改需理解其影响。
:::

按脚本提示执行命令完成更新。无需手动停机，重启由 Docker 处理。

用 `docker container ls` 确认新镜像已生效。
