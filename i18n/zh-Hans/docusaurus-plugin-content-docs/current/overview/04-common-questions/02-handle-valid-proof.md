---
title: "如何处理有效证明"
sidebar_position: 3
---
这一页回答一个直接的工程问题：**proof 验证通过后，你到底应该做什么？** 你可以在 Web2 侧消费结果，也可以在合约侧消费结果。两条路径的区别不在“验证有没有成功”，而在“你要把结果写到哪里、由谁来信任”。

先说 Web2 消费。你拿到验证结果后，最常见的操作是：授权、发放、记录审计。你不需要 receipt，只需要一个稳定的“验证指纹”，通常就是 statement 或某个可追溯 ID。把它写入数据库，就能做幂等控制和审计追溯。

```ts
type VerificationRecord = {
  statement: string
  userId: string
  action: string
  status: "verified"
  createdAt: string
}
```

Web2 侧最容易忽略的是“重复消费”。如果你不存 statement，每一次调用都会被当成新验证，结果就是重复发放或重复授权。处理方式很简单：statement 当作唯一索引，先查再写。

```ts
if (db.verifications.has(statement)) {
  return "already processed"
}
db.verifications.insert({ statement, status: "verified" })
```

再说合约消费。合约不会验证 proof，它验证的是 receipt + Merkle path。你需要先走聚合路径，拿到 receipt，再把 leaf 和 path 传给合约验证。合约侧的验证入口通常是 `verifyProofAggregation`。

```solidity
function verifyProofAggregation(
    uint256 _domainId,
    uint256 _aggregationId,
    bytes32 _leaf,
    bytes32[] calldata _merklePath,
    uint256 _leafCount,
    uint256 _index
) external view returns (bool);
```

合约验证通过后，你才应该执行“发放/授权/状态变更”。如果你在 receipt 还没发布时就执行业务逻辑，你会把验证变成“信任自己”，而不是信任 zkVerify 的验证结果。

```text
if verifyProofAggregation(...):
  executeBusinessAction()
```

这两条路径的核心差别可以用一个类比理解：Web2 消费像是“内部审批”，合约消费像是“外部公证”。内部审批你自己存档就行，外部公证必须有公证书（receipt）。

**安全考虑：**

- **重放（replay）**：proof 或 statement 被重复使用。
- **重复领取（double-claim）**：同一份资格被多次消费。
- **数据泄露**：private inputs 被错误公开。

Web2 侧的解决办法是“持久化 + 幂等控制”，合约侧的解决办法是“receipt + Merkle path + nullifier 或唯一索引”。

> ⚠️ Warning: 验证通过不等于业务完成。你仍然需要在消费层做幂等和风控，否则会出现重复授权或重复发放。

> 💡 Tip: 如果你不确定应该在哪一层消费，先用 Web2 消费跑通逻辑，再迁移到合约消费。这样你能把验证链路和业务逻辑分开调试。

这一页的目标是让你把“验证通过”变成“业务动作”。下一页会进入 Glossary，帮助你把高频术语映射回系统行为。
