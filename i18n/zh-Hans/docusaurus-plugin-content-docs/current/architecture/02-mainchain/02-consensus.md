---
title: 共识
---

# zkVerify Mainchain Consensus

zkVerify 采用带确定性终结性的委托权益证明共识，使用 BABE 出块、GRANDPA 完成终结。最高质押者会被选为出块与终结的节点。

## 出块
我们使用 [BABE](https://docs.substrate.io/reference/glossary/#blind-assignment-of-blockchain-extension-babe)（Blind Assignment for Blockchain Extension）作为出块算法。BABE 基于 slot 出块，已知的验证人集合在每个 slot 至少产出一个区块。slot 分配基于可验证随机函数（VRF）的评估。每个验证人在一个 epoch 被分配权重，epoch 被划分为多个 slot，验证人在每个 slot 计算 VRF；当 VRF 输出低于该验证人的相对权重时，可作为主作者出块。我们也启用 secondary slots，确保每个 slot 至少产出一个区块，从而维持固定出块时间。

## 区块终结
[GRANDPA](https://paritytech.github.io/polkadot-sdk/master/sc_consensus_grandpa/index.html)（GHOST-based Recursive ANcestor Deriving Prefix Agreement）是与 BABE 等出块机制配合的终结算法。

高层流程如下：

 - **出块：** 通过 BABE 等机制产出并广播，直到 GRANDPA 终结前都视为暂定。


- **区块投票：** 验证人参与多轮投票，决定应被终结的区块。每个验证人投票给其认为可终结的区块，同时隐含支持该区块的所有祖先。


- **GHOST 规则：** GRANDPA 使用 Greedy Heaviest Observed Sub-Tree（GHOST）的变体来选择获得多数票的区块。GHOST 用于挑选最“重”的链（权重最高），即获得最多验证人累计支持的链，此处权重为验证人的质押量。


- **两阶段投票：** GRANDPA 包含 “prevote” 与 “precommit” 两阶段：

    * **Prevote：** 验证人根据已见到的区块与当前链视图，投票给认为应终结的区块。

    * **Precommit：** 如果某区块是 prevote 阶段最高“已被证明”区块的后代，验证人会对其预提交。若超过 2/3 验证人直接或对其后代 prevote，则该区块被视为 justified。


- **Finalization：** 一旦超过 2/3 验证人对某区块（直接或其祖先）完成 precommit，该区块即被终结，意味着它及其所有祖先不会被回滚。

## 参数
我们采用以下配置：出块时间 6 秒，epoch 为 1 小时，era 为 6 小时。

| Parameter | Value | Description |
| --- | --- | --- |
| Slot Duration | 6 seconds | 出块时间窗口；仅在 session 切换时可加入/退出验证人集合。 |
| Epoch Duration | 600 slots (1h) | 每个 epoch 的 slot 数量，期间出块者集合固定。 |
| Era Duration | 6 epochs (6h) | 每个 era 的 epoch 数量；era 结束时进行下一轮验证人选举并结算奖励。 |
