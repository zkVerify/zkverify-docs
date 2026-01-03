---
title: 证明提交流程
---

流程如下：

1. 证明提交方（rollup / zkApp）通过对应验证 pallet 的 [`submitProof`](./02-mainchain/04-mainchain_api.md#submitproof) extrinsic 提交证明。证明叶子 `value` 为：

   ```rust
   leaf_digest = keccak256(keccak256(verifier_ctx), hash(vk), version_hash(proof), keccak256(public_inputs_bytes))
   ```

   为计算上述 `leaf_digest`（即 _statement_），每个 verifier 需定义：

   - `verifier_ctx` (a unique byte sequence)
   - verification key 的哈希方式
   - 若有版本控制，verifier 的版本哈希获取方式
   - 如何从 public inputs 提取字节序列

   Delivery owner 需确保价格随时间正确更新。

2. 若证明有效，将触发携带 statement 的 [`<VerifierPallet>::ProofVerified`](./02-mainchain/04-mainchain_api.md#proofverified) 事件；否则交易报错。
3. 失败交易同样会被打包，提交者需支付手续费，以防止 DoS。

### 域隔离的聚合

首先执行以下检查：

1. 未提供域标识则不进行聚合
2. 指定域存在但不可接受新证明时，发出 [`CannotAggregate`](./02-mainchain/04-mainchain_api.md#cannotaggregate) 事件
3. 提交者余额不足以支付自身的聚合费用份额时，同样发出 [`CannotAggregate`](./02-mainchain/04-mainchain_api.md#cannotaggregate) 事件

全部通过后：

1. 从提交者钱包扣留其聚合费用份额
2. 触发 [`Aggregate::NewProof`](./02-mainchain/04-mainchain_api.md#newproof) 事件，包含证明 `statement` 摘要、域标识 `domainId`、聚合标识 `aggregationId`
3. 当前聚合完成时触发 [`Aggregate::AggregationComplete`](./02-mainchain/04-mainchain_api.md#aggregationcomplete) 事件
4. 提交者等待携带 `domainId`、`aggregationId` 的 [`Aggregate::NewAggregationReceipt`](./02-mainchain/04-mainchain_api.md#newaggregationreceipt)，记录事件所在区块 `B`
5. 提交者可通过 [`aggregate_statementPath`](./02-mainchain/04-mainchain_api.md#aggregate_statementpath) RPC 获取提交证明的 Merkle 路径，需提供：
   - `at`：事件所在区块 `B`
   - `domain_id`
   - `aggregation_id`
   - `statement`

## Pallets

为满足需求开发了如下 pallet：

- **_Verifiers_**：定义证明、verification key、公有输入类型，实现验证逻辑，并定义组成最终 statement 哈希（证明叶子 `value`）的 3 个哈希计算方式：
  - [**risc0**](./07-verification_pallets/03-risc0.md)
  - [**groth16**](./07-verification_pallets/04-groth16.md)
  - [**ultraplonk**](./07-verification_pallets/05-ultraplonk.md)
  - [**plonky2**](./07-verification_pallets/07-plonky2.md)
  - [**sp1**](./07-verification_pallets/08-sp1.md)
  - [**ultrahonk**](./07-verification_pallets/09-ultrahonk.md)
  - [**ezkl**](./07-verification_pallets/10-ezkl.md)
