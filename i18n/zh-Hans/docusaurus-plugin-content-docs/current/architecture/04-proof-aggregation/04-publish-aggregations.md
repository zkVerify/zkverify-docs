---
title: 发布聚合
---

聚合完成时会触发 [`AggregationComplete{domainId, aggregationId}`](../02-mainchain/04-mainchain_api.md#aggregationcomplete) 事件，随后进入发布队列，不再接受新证明。

任意用户调用 [`aggregate(domainId, aggregationId)`](../02-mainchain/04-mainchain_api.md#aggregate_3) 即可生成聚合凭证（Merkle 根）。该操作需支付生成树、计算根、触发事件的成本，但可领取 [提交者冻结的资金](./02-handle-valid-proof.md#proof-submission-costs)。发布者应注意估算与实际成本可能有差异，通常应先查看存储判断是否值得发布。

`aggregate` 成功后本区块会触发 [`NewAggregationReceipt{domainId, aggregationId, receipt}`](../02-mainchain/04-mainchain_api.md#newaggregationreceipt)。提交者可用 [`aggregate_statementPath`](../02-mainchain/04-mainchain_api.md#aggregate_statementpath) RPC 计算在该凭证中的路径，记得使用事件所在区块哈希。

## Publish an Incomplete Aggregation

也可对未满的聚合调用 `aggregate`，此时发布者仅获得当前冻结资金，适用于：

- 提交者不想等待满额，愿意自付差额
- 发布者认为累积资金足以覆盖成本

可通过查看 [`aggregate.Domains`](../02-mainchain/04-mainchain_api.md#domains) 存储计算已累积资金，判断是否划算。

## Errors on call `aggregate`

`aggregate` 可能失败：

- [`UnknownDomainId`](../02-mainchain/04-mainchain_api.md#unknowndomainid) if the given domain's identifier doesn't exist
- [`InvalidAggregationId`](../02-mainchain/04-mainchain_api.md#invalidaggregationid) if the given aggregation's identifier doesn't exist in this domain, or if it was already published

出现上述情况时，发布者仅为快速失败路径付费，而非完整聚合。请注意发布竞争有风险：他人可能抢先调用，你的调用仍会产生失败路径成本。
