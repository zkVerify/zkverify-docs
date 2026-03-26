---
title: "产物总览表"
sidebar_position: 4
---

这页关心的是产物边界：哪些文件应该留在 prover 侧，哪些要交给 verifier，哪些又敏感到不该离开原本的执行环境。很多验证失败并不是链的问题，而是产物组合错了，比如 proof 和 vk 来自不同编译结果。

你会在两个场景里最常遇到这张表：一是接入流程里做存储设计，二是验证失败时做排错。前者需要明确“哪些产物允许被缓存、哪些只能在客户端存在”；后者需要知道“我到底该回头查哪一环”。

下面这张表是完整清单。它不是流程图，而是“交接单”。你可以直接用它对照：这项产物应该在谁手里、应该流向哪里、是不是敏感数据。

| Artifact | Who generates it | Who consumes it | Sensitive? |
| --- | --- | --- | --- |
| secret | Prover | Prover | Yes |
| witness | Prover | Prover | Yes |
| proof | Prover | Verifier | No |
| public inputs | Prover | Verifier | No |
| pk | Setup / Prover | Prover | Yes |
| vk | Setup / Prover | Verifier | No |
| SRS | Setup ceremony | Prover / Verifier | No |

如果你在调试时卡住，先把 vk、proof、public inputs 放到同一张“版本对照表”里看一遍。验证侧不是孤立地看 proof，它会把 vk、proof 版本信息和 public inputs 绑定成 statement hash。只要其中任何一项来自不同版本，最终的 statement 就会变掉，验证结果自然不对。

```text
statement = keccak256(
  keccak256(verifier_ctx),
  hash(vk),
  version_hash(proof),
  keccak256(public_inputs_bytes)
)
```

如果你要给团队做权限边界设计，这张表也能直接转成“存储策略”：secret / witness 只在 Prover 侧落盘，proof / public inputs 允许进入验证层，vk 可以被复用但要严格做版本管理。你不需要把这些产物都塞进同一个数据库，反而应该按敏感等级分层。

> ⚠️ 注意：一旦 secret 或 witness 离开 Prover 侧，你就破坏了隐私假设。验证即使能过，系统也已经失去安全性。

> 💡 提示：如果你发现验证偶发失败，优先检查“vk 与 proof 是否来自同一套编译产物”，这个问题比链上逻辑问题更常见。

把这张表当成交接清单，先核对产物流向，再去看链上行为。下一节会继续解释不同 setup 模式下这些产物为什么变化不一样。
