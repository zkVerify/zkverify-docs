---
title: "3B.5 Relay vs Mainchain API"
sidebar_position: 6
---
This section addresses an engineering decision: **do you use a relay API like Kurier, or interact with the main chain directly?** This is not “advanced vs. basic,” but a tradeoff between “engineering control vs. integration complexity.” You need to understand your system goals and the on-chain details you are willing to take on.

Start with Kurier. Its key trait is a “Web2 experience”: you call REST endpoints with an API key, `register-vk` first, then `submit-proof`, then poll `job-status`. You do not have to manage on-chain sessions yourself or handle on-chain events directly, but you are still using on-chain verification; Kurier just handles the details for you.

```ts
const regResponse = await axios.post(`${API_URL}/register-vk/${process.env.API_KEY}`, regParams)
const requestResponse = await axios.post(`${API_URL}/submit-proof/${process.env.API_KEY}`, params)
const jobStatusResponse = await axios.get(
  `${API_URL}/job-status/${process.env.API_KEY}/${requestResponse.data.jobId}`
)
```

Kurier gives you a status flow: `Queued → Valid → Submitted → IncludedInBlock → Finalized` or `Failed`. These states only appear when you include `chainId` during submission. Many people think “no status means the system is stuck,” when it is simply missing on-chain state updates.

Now the mainchain route. You can call `submitProof` directly with Polkadot.js. This lets you control every on-chain parameter and listen to on-chain events directly. The cost is that you must manage on-chain accounts, fees, and event subscriptions yourself, which is a heavier burden for backend engineering.

```text
submitProof({
  vkOrHash: Vk,
  proof,
  pubs,
  domainId
})
```

The essence of the difference is “outsourced vs. self-run.” Kurier is outsourced: it runs the on-chain flow for you. Mainchain interaction is self-run: all the process details are in your hands. If you need stronger observability and finer-grained event control, choose the mainchain path. If you care more about integration speed and maintenance cost, Kurier is a better fit.

Here is a more direct comparison:

| Dimension | Kurier | Mainchain / Polkadot.js |
| --- | --- | --- |
| Integration cost | Low | High |
| Control granularity | Low | High |
| Event observability | Indirect | Direct |
| Account and fee management | Abstracted by Kurier | You handle it |
| Suitable teams | Web2-leaning backend teams | Teams familiar with on-chain interaction |

A common misconception is “if I use Kurier, I do not need to understand domains.” The opposite is true: domain decides whether a proof enters aggregation, and Kurier only calls the API for you. If you do not understand domainId, you still will not get a receipt or an on-chain-usable result.

> 💡 Tip: You can run through the flow with Kurier first, then migrate critical paths to mainchain interaction. This validates your approach quickly while preserving long-term control.

> ⚠️ Warning: Do not treat Kurier as a shortcut to “bypass on-chain logic.” It only wraps the on-chain flow; you still bear responsibility for on-chain rules and result consistency.

If you are still unsure which route to take, ask yourself two questions:

1) Do I need fast launch more, or on-chain observability more?
2) Can I maintain on-chain accounts and event subscriptions long term?

Your answers will push you toward one path. The next section moves into examples and a cookbook so you can run a full sample on your chosen path.
