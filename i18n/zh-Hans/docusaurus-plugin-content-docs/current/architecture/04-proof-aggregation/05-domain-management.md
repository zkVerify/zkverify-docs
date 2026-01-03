---
title: 域管理
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

域由标识符确定，定义聚合类别及关键属性：

- Aggregation size
- Publishing queue size

任何人都可创建域并成为拥有者。创建需冻结资金，数量取决于聚合大小与队列大小，域移除时释放。

## Create a new domain

调用 [`registerDomain(aggregationSize, queueSize)`](../02-mainchain/04-mainchain_api.md#registerdomain) 并设置聚合/队列大小。

聚合大小应小于 128，无符号整数，因对应 Merkle 树大小最好用 2 的幂。提交者可据此估算目标链凭证的 membership 证明成本：越大成本越高，但同一聚合 amortize 的证明更多，跨链成本更低。

发布队列大小应 ≤16，表示可等待发布的聚合数。值小可能导致提交时频繁出现 `CannotAggregate(DomainFull)`，值大则需冻结更多资金。

若资金不足以覆盖存储成本，`registerDomain` 会失败，否则资金整个生命周期被冻结。

## Remove a domain

移除域需先置为 `Hold` 再注销。`Hold` 状态下不再接收证明，直至无待发布聚合后转为 `Removable`。

使用 [`holdDomain(domainId)`](../02-mainchain/04-mainchain_api.md#holddomain) 置为 `Hold`，触发 [`DomainStateChanged{id, state}`](../02-mainchain/04-mainchain_api.md#domainstatechanged)；若仍有未发布聚合则为 `Hold`，否则为 `Removable`。`Hold` 状态下每次发布聚合后可能转为 `Removable` 并触发事件。若域仅允许白名单提交，且名单未清空则仍为 `Hold`，可用 [`removeProofSubmitters`](../02-mainchain/04-mainchain_api.md#removeproofsubmitters) 移除 [`SubmittersAllowlist`](../02-mainchain/04-mainchain_api.md#submittersallowlist) 中的地址。

处于 `Removable` 时，域主可调用 [`unregisterDomain(domainId)`](../02-mainchain/04-mainchain_api.md#unregisterdomain)，解锁资金并触发 `Removed` 事件。

## System Domains

我们提供预注册的 `System Domains`，具备以下保证：

- 聚合就绪（或按内部策略如超时）时，Aggregator Service 会调用 aggregate extrinsic
- Mechanism 为 “Bot” 的域：我们运行链下 relayer 监听新 Aggregation Receipt 并发布到指定目标链
- 支持 Hyperbridge 的域：我们运行自有 relayer 到 Hyperbridge 链，并承担费用（目前）

[如下列表](#listdomains)

各目标链合约地址见 [对应章节](../08-contract-addresses.md)。

<Tabs groupId="networks">
<TabItem value="mainnet" label="Mainnet">
| Domain ID | Chain             | Mechanism   |
| --------- | ----------------- | ----------- |
| 2         | Base              | Bot         |
</TabItem>
<TabItem value="testnet" label="Testnet">
| Domain ID | Chain             | Mechanism   |
| --------- | ----------------- | ----------- |
| 175       | Horizen Testnet   | Bot         |
| 0         | Ethereum Sepolia  | Bot         |
| 1         | Ethereum Sepolia  | Hyperbridge |
| 2         | Base Sepolia      | Bot         |
| 3         | Optimism Sepolia  | Bot         |
| 4         | Arbitrum Sepolia  | Bot         |
| 5         | Arbitrum Sepolia  | Hyperbridge |
| 56        | EDU Chain Testnet | Bot         |
</TabItem>
</Tabs>
