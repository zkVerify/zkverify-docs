---
title: 概览
---

证明聚合引擎用于定义可发送到不同链的聚合上下文，并为链上用户提供生成聚合的收益方式。

核心概念是 **`Domain`**，每个 Domain 有唯一 `id` 和以下属性：

* **Aggregation size**：该域每个聚合包含的最大证明数。越小则目标链验证成本越低、发布频率更高，但同一聚合 amortize 的证明更少，桥接成本相对更高。
* **Publish queue size**：待发布聚合的队列长度；队列满时需等待已有聚合发布。值越大，证明被丢弃概率越低，但域拥有者需更多资金维持存储。

域拥有者需绑定足够资金覆盖存储成本，移除域时释放。链持有的总资金与 aggregation size $A$、publish queue size $Q$ 成正比：

$$
Hold = 2.64 + 0.1 \cdot StorageBytes = 2.64 + 0.1 \cdot (62 + 56 \cdot A + 22 \cdot Q + 56 \cdot A \cdot Q)
$$

$2.64$ 为基础押金，其余取决于占用的存储大小。

另一个重要概念是 **无许可发布**：域可配置为任何人均可发布聚合，发布者由聚合中包含的证明所属账户支付奖励。

最后，**已发布聚合有时效**：仅在发布的那个区块保持已发布状态；计算 ownership proof 时需明确 [`NewAggregationReceipt`](../02-mainchain/04-mainchain_api.md#newaggregationreceipt) 事件所在区块。
