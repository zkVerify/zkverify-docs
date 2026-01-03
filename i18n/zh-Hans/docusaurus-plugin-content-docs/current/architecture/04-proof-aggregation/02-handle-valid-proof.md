---
title: 处理有效证明
---

当有效证明通过 [`submitProof`](../02-mainchain/04-mainchain_api.md#submitproof) 的 `domainId` 路由到某域时，会被加入该域的下一个聚合，同时在提交者钱包中冻结一定金额，直到聚合发布。冻结资金用于支付发布者费用，详见 [Publish Aggregation](./04-publish-aggregations.md)。插入聚合会触发 [`NewProof{statement, domainId, aggregationId}`](../02-mainchain/04-mainchain_api.md#newproof) 事件。提交者应监听包含自身域与聚合的 `NewAggregationReceipt{domainId, aggregationId, receipt}` 事件，因为计算证明的 Merkle 路径必须**提供该事件所在区块**，可通过 [`aggregate_statementPath`](../02-mainchain/04-mainchain_api.md#aggregate_statementpath) RPC 获取。

若异常，**`submitProof` extrinsic 不会失败**，而是触发 [`CannotAggregate{statement, cause}`](../02-mainchain/04-mainchain_api.md#cannotaggregate) 事件，原因可能是：

- `DomainNotRegistered{domainId}`: if the submitter has provided an invalid `domainId`.
- [`InvalidDomainState{domainId, state}`](./05-domain-management.md#remove-a-domain): the domain is not ready to accept any other proof.
- `DomainStorageFull{domainId}`: if the domain queue is full, in this case no proof can be added to that domain till at least an aggregation is published.
- `InsufficientFunds`: if the submitter account hasn’t enough funds to cover for its contribution to the aggregation's publication.
- [`UnauthorizedUser`](./03-core-concepts.md#submitting-security-rules): if the submitter account is not authorized to submit proofs on this domain.

总结：提交者需监听 `submitProof` 生成的事件：

- 正常时的 `NewProof`，包含聚合坐标
- 异常时的 `CannotAggregate`，包含失败原因

## Proof Submission Costs

在域 $D$ 中，每个提交者需冻结金额 $A$：

$$
A(a) = \frac{Estimate(a) + Tip(a)}{size(a)}
$$

其中：

- $a$ is the aggregation where the proof is inserted
- $Estimate(a)$ is a price estimation for generating the aggregation **at the time of the submission**
- $Tip(a)$ is the amount of the tip for the publisher
- $size(a)$ the maximum size aggregation that is defined in the domain

Currently

$$
Tip(a) = 0.1 + 0.1 * Estimate(a)
$$
