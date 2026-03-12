---
title: "快速上手总览"
sidebar_position: 1
---

Quickstart 这一章的作用很直接：用最少的准备把 proof 提交出去，并拿回一个稳定的验证结果。这里先不展开 domain、聚合和合约消费，而是先确认 proof、vk、public inputs 和提交参数本身都能对齐。

你可以从 Kurier 或 zkVerifyJS 开始。Kurier 是 REST API 路线：申请 API key，调用 `register-vk`，再调用 `submit-proof`。zkVerifyJS 是直接跟链交互的路线：配置 seed phrase，启动会话，然后发起验证请求。两条路用到的核心产物是一样的，都是 proof、vk 和 public inputs。

verify-only 的终点是 `ProofVerified` 事件。你不需要把验证结果再发到目标链，只要在应用侧消费它就行。最常见的处理方式是把 statement 当成业务侧的“已验证标识”，进入后续流程（权限、结算、审计）。

Kurier 路线还提供 job-status 轮询。对验证路径来说，你通常会关注 `Submitted` → `IncludedInBlock` → `Finalized`，用它判断结果何时稳定；如果你走的是聚合路径，后面还可能看到 `AggregationPending` → `Aggregated`。zkVerifyJS 则是更链上化的路径，你需要保证账户里有 tVFY 用于交易费，才能完成一次验证请求。

如果你最终要把结果交给链上合约，后面的章节会继续加上聚合和 receipt 发布。眼下这一步的目标更小也更实用：先稳定拿到验证结果，确认你现在产出的 proof 产物确实能被 zkVerify 正常使用。
