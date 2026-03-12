---
title: "五步流程"
sidebar_position: 3
---

这五步的价值在于“定位问题”。你把它当作一条装配线：链下先把证明做出来，链上再做验证。只要你知道每一步产物在哪里，就能判断问题是出在编译、生成、还是验证。

ZK 证明系统里，proof 的生成发生在链下，而验证通常发生在链上。生成这一步不是“直接跑出 proof”，而是先把程序编译成中间表示，再经过多项式转换、承诺和 Fiat‑Shamir 等后端变换，最后才产出 proof。这个事实决定了你在工程上会同时面对本地计算和链上验证两类故障。

下面是一个工程视角的流水线示意图：

```mermaid
flowchart LR
  A[Compile to IR] --> B[Backend transforms]
  B --> C[Prove off-chain]
  C --> D[Prepare public inputs]
  D --> E[Verify on-chain]
```

你可以把这条线拆成五个“你会实际遇到的动作”，不是抽象名词：

1) Compile：把电路/程序编译成中间表示（r1cs/wasm 或 acir）。没有这一步，后续没有任何输入。
2) Setup/SRS：某些系统需要 setup 或 SRS 来产出 pk/vk。vk 会贯穿到验证阶段。
3) Witness：整理私有输入并生成 witness，它是 proof 的原材料。
4) Proof：用编译产物 + witness 产出 proof，并生成 public inputs。
5) Verify：用 vk + proof + public inputs 得到验证结果。

下面是最小的“验证输入拼装”示意，帮助你理解为什么 public inputs 和 vk 不能错位：

```text
statement = keccak256(
  keccak256(verifier_ctx),
  hash(vk),
  version_hash(proof),
  keccak256(public_inputs_bytes)
)
```

一个更工程化的类比是“出厂检验”：Compile/Setup/Witness/Proof 是在工厂里完成的生产线，Verify 是质检线。你如果在质检线发现问题，第一反应不是改检验规则，而是回溯生产线是否换了工艺（比如 vk 和 proof 是否来自同一套编译产物）。

> ⚠️ 注意：proof 验证失败最常见的原因不是链上逻辑，而是 vk、proof、public inputs 不来自同一套编译产物。

最后给一个小的分工提示：proof 生成慢通常是 Step 3/4 的问题，验证慢才是 Step 5 的问题。把这两个阶段分开，你才能真正定位性能瓶颈。
