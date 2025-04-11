---
title: Publish Aggregations
---

Every time an aggregation is complete a [`AggregationComplete{domainId, aggregationId}`](../02-mainchain/05-mainchain_api.md#aggregationcomplete) event is emitted; the aggregation now is complete, no more proofs can be added to it and is moved in the publishing queue.

In order to generate an aggregation receipt (the Merkle root) it's sufficient that any user calls [`aggregate(domainId, aggregationId)`](../02-mainchain/05-mainchain_api.md#aggregate_3) with the correct coordinates. Building this aggregation has a cost because you should pay for the computation to generate the tree, compute the root and emit the events, but the user will receive the money that was collected by the [proof submitters](./02-handle-valid-proof.md#proof-submission-costs). The publisher should take into account the fact that the estimations he did to hold the money from the proof submitters can be different from the actual price: in the normal flow a publisher should evaluate if it's worth to generate the aggregation by inspecting the storage before doing the call.

If the `aggregate` succeeds a [`NewAggregationReceipt{domainId, aggregationId, receipt}`](../02-mainchain/05-mainchain_api.md#newaggregationreceipt) event is emitted in this block. Now the proof submitters can use the [`aggregate_statementPath`](../02-mainchain/05-mainchain_api.md#aggregate_statementpath) RPC to compute
the path of the statement in this receipt: don't forget to save the block hash where the event is emitted to use it in the RPC call.

## Publish an Incomplete Aggregation

It's also possible to call `aggregate` extrinsic on an incomplete aggregation: in this case the publisher will receive just the money put on hold till this moment. This can be useful when:

- a submitter would want to generate his aggregation without waiting for it to become complete and pay himself the difference
- a publisher thinks that it is already convenient for him to proceed with the aggregation because the accumulated funds are enough to cover for the execution cost

In order to understand if it's worth or not to call `aggregate` on a given aggregation is it possible to compute the accumulated funds by inspecting the [`aggregate.Domains`](../02-mainchain/05-mainchain_api.md#domains) storage.

## Errors on call `aggregate`

The aggregate extrinsic can fail in the following cases:

- [`UnknownDomainId`](../02-mainchain/05-mainchain_api.md#unknowndomainid) if the given domain's identifier doesn't exist
- [`InvalidAggregationId`](../02-mainchain/05-mainchain_api.md#invalidaggregationid) if the given aggregation's identifier doesn't exist in this domain, or if it was already published

In both of these cases the publisher will not pay for a complete aggregation, but just for its fail fast path. Please be aware of the fact that competing for publication is not risk-free: somebody can call it before you and you will be charged for your call but just for the fail fast path.
