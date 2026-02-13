---
title: "Relay 与 Mainchain API 对比"
sidebar_position: 6
---
这一节解决一个工程决策问题：**你是用 Kurier 这样的 relay API，还是直接和主链交互？** 这不是“高端/低端”的区别，而是“工程控制权 vs 接入复杂度”的取舍。你要先看清楚你的系统目标和你愿意承担的链上细节。

先说 Kurier。它的特点是“Web2 体验”：你用 API Key 调用 REST 接口，先 `register-vk` 再 `submit-proof`，然后用 `job-status` 轮询状态。你不需要自己管理链上会话、不需要直接处理链上事件，但你仍然在走链上验证，只是把细节交给了 Kurier。

```ts
const regResponse = await axios.post(`${API_URL}/register-vk/${process.env.API_KEY}`, regParams)
const requestResponse = await axios.post(`${API_URL}/submit-proof/${process.env.API_KEY}`, params)
const jobStatusResponse = await axios.get(
  `${API_URL}/job-status/${process.env.API_KEY}/${requestResponse.data.jobId}`
)
```

Kurier 会给你一个状态流：`Queued → Valid → Submitted → IncludedInBlock → Finalized` 或 `Failed`。这些状态只有在你提交时带了 `chainId` 才会出现。很多人误以为“没状态就是系统卡住”，其实只是没有链上状态更新。

再说主链交互。你可以用 Polkadot.js 直接调用 `submitProof`。这种方式能让你控制每一个链上参数，也能让你直接监听链上事件。代价是你要自己管理链上账户、交易费和事件订阅，这对于后端工程来说是更重的负担。

```text
submitProof({
  vkOrHash: Vk,
  proof,
  pubs,
  domainId
})
```

两条路径的本质区别可以用“代办 vs 自己跑流程”来理解：Kurier 是代办，帮你把链上流程跑完；主链交互是自己跑，流程细节全在你手里。你如果需要更强的可观测性、更细粒度的事件控制，就应该走主链路径；你如果更在意接入速度和维护成本，Kurier 更合适。

下面是一个更直观的对比清单：

| 维度 | Kurier | Mainchain / Polkadot.js |
| --- | --- | --- |
| 接入成本 | 低 | 高 |
| 控制粒度 | 低 | 高 |
| 事件可观测性 | 间接 | 直接 |
| 账户与交易费管理 | 由 Kurier 抽象 | 你负责 |
| 适合的团队 | 偏 Web2 的后端团队 | 熟悉链上交互的团队 |

一个常见误解是“用了 Kurier 就不用理解 domain”。事实恰好相反：domain 决定 proof 是否进入聚合，而 Kurier 只是帮你调用 API。你如果不知道 domainId 的含义，最终还是拿不到 receipt 或链上可用的结果。

> 💡 Tip: 你可以先用 Kurier 跑通流程，再把关键路径迁移到主链交互。这样既能快速验证思路，又能保留后期的控制权。

> ⚠️ Warning: 不要把 Kurier 当成“绕过链上逻辑”的捷径。它只是把链上流程封装了，你仍然要承担链上规则与结果的一致性。

如果你现在还不确定选哪条路，问自己两个问题：

1) 我是更需要快速上线，还是更需要链上可观测性？
2) 我能否长期维护链上账户与事件订阅？

答案会直接把你推向其中一条路径。下一节会进入示例与 cookbook，你可以选择一条路径跑一个完整样例。
