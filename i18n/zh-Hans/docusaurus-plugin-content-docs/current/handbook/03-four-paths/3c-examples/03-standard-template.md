---
title: "示例标准模板"
sidebar_position: 4
---
这一页定义的是 handbook 里示例的统一写法。目标很简单：让读者一眼看到这个例子解决什么问题、输入怎么拆、是否需要聚合、结果在哪里消费。

每个示例都应该回答四个问题：

1) 这个例子证明什么、解决什么场景？
2) 哪些输入是公开的、哪些必须私有？
3) 是否需要 domain（是否走聚合）？
4) 结果最终在哪里消费（Web2 还是合约）？

下面是标准模板。每一项都应该对应到一个具体的工程判断。

---

## 示例模板（必须填写）

**Use case / threat model（用例 / 威胁模型）**

- 我在证明什么？
- 我在防什么风险？（重复使用、重放、越权、假身份）

**Public vs private inputs（公开输入 vs 私有输入）**

- Public inputs：
- Private inputs：
- 为什么必须这样拆？

**Domain requirement（是否需要 domain）**

- 是否需要 domain？
- 如果需要，为什么要进入聚合？
- 如果不需要，为什么 verify-only 就够？

**Consumption target（结果消费端）**

- 结果在 Web2 消费还是合约消费？
- 如果是合约消费，需要什么形式的结果？

---

## 示例：把模板填一遍（真实代码片段）

下面用一个“成员资格验证”的例子把模板完整填一遍，重点是把结构写清楚。

**Use case / threat model（用例 / 威胁模型）**

- 证明“我在名单里”，但不泄露名单。
- 防止非成员伪造 proof。

**Public vs private inputs（公开输入 vs 私有输入）**

- Public inputs：`root`（名单的 Merkle root）
- Private inputs：`leaf`、`pathElements[]`、`pathIndices[]`
- 拆分原因：root 必须公开才能验证，路径和叶子必须私有才能保护身份。

**Domain requirement（是否需要 domain）**

- 需要 domain（如果结果要给链上合约消费）。
- 不需要 domain（如果只在 Web2 侧消费）。

**Consumption target（结果消费端）**

- Web2：监听验证事件后直接放行。
- 合约：需要 receipt + Merkle path。

---

## 提交输入的最小真实代码

**Kurier / REST 路线**

```ts
const params = {
  proofType: "ultrahonk",
  vkRegistered: true,
  chainId: 11155111,
  proofData: {
    proof: proof.proof,
    publicSignals: proof.pub_inputs,
    vk: vk.vkHash || vk.meta.vkHash
  }
}
await axios.post(`${API_URL}/submit-proof/${process.env.API_KEY}`, params)
```

**Polkadot.js / 主链路线**

```text
submitProof({
  vkOrHash: Vk,
  proof,
  pubs,
  domainId
})
```

这两段代码的意义不是“你必须这样写”，而是告诉你模板里的“输入拆分”会落实成什么结构：proof、vk、public inputs 和 domainId 必须在提交层出现，否则后面无从验证。

---

## 为什么模板必须严格执行

你会在真实项目里反复遇到以下情况：

- 例子能跑通，但没人知道它在证明什么。
- 例子看起来合理，但 public/private 拆分错了，隐私直接泄露。
- 例子跑完没有产出可用结果，因为消费端没有对齐。

这不是“写作质量问题”，而是**工程设计失真**。模板是为了让读者把例子变成自己的工程组件，而不是单纯 copy‑paste。

> 💡 提示：在写例子前，先把模板四项填完。填不出来就不要写代码。

> ⚠️ 注意：不要把 domain 当成“装饰字段”。它决定你走不走聚合、能不能链上消费。

最后提醒一次：这个模板不是为了统一格式，而是为了统一工程语义。只要每个例子都能把“证明内容、输入拆分、聚合需求、消费端”讲清楚，你的示例就能被真实项目复用。
