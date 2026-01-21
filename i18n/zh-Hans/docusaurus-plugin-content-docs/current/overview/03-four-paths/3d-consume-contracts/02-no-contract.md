---
title: "3D.2 I Do Not Have a Contract (System-Level Consumption)"
sidebar_position: 3
---
这一节写给“结果只在 Web2/系统侧消费”的场景。你不需要 receipt，不需要链上合约，只需要**稳定地拿到验证结果，并把它落到业务系统里**。这听起来简单，但实际工程里容易踩三个坑：事件丢失、重复处理、以及确认深度不足。

在 verify‑only 路线里，你的核心信号是验证状态。最常见的方式是用 Kurier 的 `job-status` 轮询：状态从 `Submitted` → `IncludedInBlock` → `Finalized`，当它进入 `Finalized`，你就可以认为验证结果稳定可用。

```ts
const jobStatusResponse = await axios.get(
  `${API_URL}/job-status/${process.env.API_KEY}/${jobId}`
)
if (jobStatusResponse.data.status === "Finalized") {
  // consume verification result
}
```

这里有一个很现实的注意点：只有当你提交 proof 时带了 `chainId`，这些状态才会出现。如果你不带 `chainId`，轮询就会永远“没有进展”，这不是系统坏了，而是你没有走链上状态流。

把 verify‑only 想成“业务侧验收”。你不需要链上验证 receipt，但你必须在业务侧保存一个可追溯的验证记录，否则你会在重试和审计时失去依据。最简单的做法是把 statement 和业务上下文一起持久化。

```ts
type VerificationRecord = {
  statement: string
  status: "verified"
  userId: string
  createdAt: string
}
```

这个记录的意义不在于“存一条日志”，而是让你做幂等控制。只要 statement 已经存在，你就拒绝再次处理，从而避免重复授权或重复发放。

```ts
if (db.verifications.has(statement)) {
  return "already processed"
}
db.verifications.insert({ statement, status: "verified" })
```

如果你需要更强的可靠性，可以把“确认深度”作为业务规则：例如只有在 `Finalized` 状态才写入记录，避免因链上回滚导致误判。这个策略的工程意义是：把“链上不稳定期”和“业务侧确认期”隔离开。

> 💡 Tip: 先把 `Finalized` 作为默认门槛，如果你需要更快的反馈，再考虑 `IncludedInBlock`。

> ⚠️ Warning: 不要把 `Submitted` 当成验证成功。它只是“已经送上链”，不是“结果已稳定”。

这里的核心是“结果消费的可靠性”。你不需要 receipt，但你必须处理事件丢失、重复处理和确认深度这三类问题。否则你的验证系统看起来能跑，实际业务会出现随机错账。

下一节会讲“什么时候聚合是必须的”，帮你判断什么时候应该从 verify‑only 迁移到链上消费路径。
