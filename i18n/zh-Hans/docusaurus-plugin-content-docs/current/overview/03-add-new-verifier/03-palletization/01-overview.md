---
title: 概览
---

## 模板

用于集成 verifier 库的两大工具：

- 库 `hp-verifiers`：提供抽象与通用层，为 verifier pallet 提供原语。可在库中找到基础数据结构模板（如 `Arg`，用于 proof 与 public inputs）、默认错误列表，以及定义 pallet 约束的核心 trait：`Verifier` 与 `WeightInfo`。
- Pallet `pallet-verifiers`：描述为 “Abstract verification pallets and provide the common extrinsics”，所有现有 pallet 均基于此模板构建。它提供存储、事件、交易等关键组件，使你的库能成为 pallet 并在 Substrate runtime 中使用。

后续章节提供高层指引，具体实现可能需要你自行增删和调整相关步骤与代码片段。
