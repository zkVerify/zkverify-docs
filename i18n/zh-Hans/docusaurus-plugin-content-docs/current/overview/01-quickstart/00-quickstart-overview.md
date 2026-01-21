---
title: "1. Quickstart (Verify Once in 10–20 Minutes)"
sidebar_position: 1
---

Quickstart 的目标很简单：先让你跑通一次“提交 proof → 得到验证结果”的闭环。我们刻意把复杂决策往后放，先把验证的通路打通，再逐步引入聚合、domain 或链上消费。这样做的好处是，你能尽快知道 proof 和 vk 是否匹配、提交参数是否正确，而不是一开始就被链上依赖拖慢。

这一章有两条最短路径：Kurier 和 zkVerifyJS。Kurier 是 REST API 路线，你需要先拿到 API Key，然后用 `register-vk` 注册 vk，再用 `submit-proof` 提交 proof。zkVerifyJS 是直接跟链交互的路线，你需要在本地配置 seed phrase，并用它启动 Volta 会话提交验证请求。这两条路线的共同点是：你都需要准备 proof、vk 和 public inputs，然后等待验证结果。

verify-only 的终点是 `ProofVerified` 事件。你不需要把验证结果再发到目标链，只要在应用侧消费它就行。最常见的处理方式是把 statement 当成业务侧的“已验证标识”，进入后续流程（权限、结算、审计）。

Kurier 路线还提供 job-status 轮询，状态会从 `Submitted` → `IncludedInBlock` → `Finalized`，你可以用它来判断验证是否完成。zkVerifyJS 则是更链上化的路径，你需要保证账户里有 tVFY 用于交易费，才能完成一次验证请求。

如果你最终需要链上消费，后面的章节会进入聚合与 receipt 发布流程。这一步会引入更多链上依赖，所以这里先保证你能稳定跑通 verify-only，确认“proof 能被验证”这件事没有偏差。
