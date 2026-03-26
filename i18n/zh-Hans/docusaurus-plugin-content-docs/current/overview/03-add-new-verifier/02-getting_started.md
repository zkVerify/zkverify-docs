---
title: 快速开始
---

## 前置条件

本教程仅有一项前置条件：你已经有一个 verifier 的库 crate，且已发布在 [GitHub](https://github.com/) 或 [crates.io](https://crates.io/)。

verifier 通常要处理以下要素：

- Verification key：`vk`，可为定长数组、slice、vec 或 struct
- Raw proof：`proof`，可为定长数组、slice、vec 或 struct
- Public inputs：`pubs`，可为定长数组、slice、vec 或 struct
- Verification function：无状态函数，入参为 vk-proof-pubs 三元组，用于判断 proof 是否与 verification key 一致、且与给定 public inputs 匹配。

最后，你需要确定该库 crate 能否在不依赖标准库（`no_std`）的情况下构建。若支持 `no_std`，则兼容 WASM，可通过 forkless upgrade 引入 zkVerify；反之则绑定到节点实现（NATIVE 模式），只能通过分叉升级。明确这一点很重要，后续教程会针对两种情况提供不同指引。

:::note
主网升级更容易采用 WASM 路径，建议尽量走 WASM。如果库依赖标准库，尽可能重构以移除依赖；只有确实无法避免时才走 NATIVE 路径。
:::

## 集成库

在 Substrate 中，链的业务逻辑位于名为 [runtime](https://docs.substrate.io/learn/architecture/#runtime) 的库内。runtime 的构建模块是更小的库，即 [pallets](https://docs.substrate.io/tutorials/build-application-logic/add-a-pallet/)。

集成 verifier 库可分三部分：

- 利用预定义模板完成库的 “pallet 化”，将其封装为可在 Substrate runtime 中使用的函数层。
- 将该 pallet 纳入 runtime，使其在 zkVerify 链上可用。
- 调整端到端测试。

继续前请确保已在本地获取 [zkVerify](https://github.com/zkVerify/zkVerify) 仓库。

可参考两条专用分支：面向 [WASM](https://github.com/zkVerify/zkVerify/tree/docs/new_verifier_tutorial_wasm) 与 [NATIVE](https://github.com/zkVerify/zkVerify/tree/docs/new_verifier_tutorial_native)。已有的 verifier pallet 也是很好的参考与对照资源。
