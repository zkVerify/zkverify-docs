---
title: "构建 zkVerify 项目要做的三件事"
sidebar_position: 3
---

## 它是什么

当你开始把 zkVerify 放进真实工程里，会发现大部分复杂度并不在“链上验证的那一刻”，而在接入前的准备和接入后的消费。这个页面把流程压缩成三个动作，让你先确定自己该做的边界，而不是陷在术语里。

第一件事是选证明系统。zkVerify 支持多种证明体系，你的选择会直接影响证明形态和成本特征，比如 SNARK 通常更小、更快验证，而 STARK 往往更大、链上更贵；zkVM 更通用，但通常带来更高的 prover 开销和更大的证明体积。这一步不是“选名字”，而是选你的工具链和工程负担。

第二件事是准备验证上下文。zkVerify 验证时会计算 statement hash，它由验证上下文、验证 key、proof 版本信息和 public inputs 的哈希构成。也就是说，你需要准备 vk 和 public inputs，并保证验证上下文是确定的、可复用的。这个上下文决定了 zkVerify 如何判定“这份 proof 属于哪个验证语境”。

第三件事是让用户生成 proof、提交给 zkVerify，并把结果接回你的系统。proof 本身来自你的 prover 工具链，提交时包含 vk 和 public inputs。验证通过后，proof 会进入聚合流程并形成 receipt，最终可被目标系统消费。这一步决定了你的业务系统如何“信任”验证结果。

## 什么时候需要

当你计划把验证从应用内部抽出来，让多个系统复用同一份验证结论时，需要把这三件事当成最低责任边界。它们分别对应“选工具链”“定义验证语境”“连接验证结果与业务系统”。

如果你的 proof 需要被链上合约或跨链系统消费，第二和第三步会变成核心工程工作：你必须能稳定产出 statement hash，并能拿到可被目标系统引用的 receipt。

## 什么时候不需要

如果你只是本地验证或单系统内验证，不打算把结果交给 zkVerify，这个最小模型就不适用。只有当你选择把验证交给 zkVerify 时，三步才成立。

## 你可能会问

Q: 选证明系统到底影响什么？
A: 影响 proof 的大小、验证成本和工具链复杂度。例如 STARK 往往更大、链上更贵，而 SNARK 更小但通常需要可信设置。

Q: 验证上下文里必须有什么？
A: 至少包含 vk 和 public inputs，并且能够构造出确定的 statement hash。zkVerify 用它来识别这份 proof 的验证语境。

Q: 为什么第三步不能省？
A: zkVerify 只负责验证，你仍然要负责把验证结果接回业务系统并做消费决策。

## 示例

下面的流程图是三步的最小映射，后面章节会把每一步拆开解释：

```mermaid
flowchart LR
  A[Choose proof system] --> B[Prepare verification context]
  B --> C[Submit proof & consume result]
```

一个最小的“验证上下文”示意写法如下，关键在于你能产出与 zkVerify 一致的 statement hash：

```text
statement = keccak256(
  keccak256(verifier_ctx),
  hash(vk),
  version_hash(proof),
  keccak256(public_inputs_bytes)
)
```

## 常见坑

症状：提交的 proof 总是无法被复用，或者不同环境算出来的 statement 不一致。原因：验证上下文不固定，vk/public inputs 的序列化方式在不同组件里不一致。避免方式：先统一 vk 和 public inputs 的编码方式，再在所有提交与消费环节复用同一套 statement 计算逻辑。
