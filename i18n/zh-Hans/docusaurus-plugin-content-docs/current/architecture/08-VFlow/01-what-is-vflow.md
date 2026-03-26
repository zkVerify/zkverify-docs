---
title: 什么是 VFlow？
---

VFlow 是 zkVerify 的首条系统平行链，专为连接 EVM 生态而设计。它的主要目标是让 VFY 代币可以从 zkVerify 跨到 EVM 链。

- VFlow 是一条 *许可制* EVM 链。
- VFlow 基于 [OpenZeppelin EVM Template](https://github.com/OpenZeppelin/polkadot-runtime-templates/tree/main/evm-template) 与 [Moonbeam](https://moonbeam.network/) 的 [Frontier 分支](https://github.com/moonbeam-foundation/frontier) 构建。[Frontier](https://github.com/polkadot-evm/frontier) 为 Substrate 提供 EVM 兼容层，完整支持 Ethereum RPC，可继续使用 Metamask、Foundry、Hardhat、ReMix 等常见 EVM 工具开发与交互。

## Parachain
Parachain 是 Polkadot 的核心扩展方式，也是 zkVerify 的扩展手段。可将其视为侧链或分片，相比中继链拥有独立共识、经济模型、治理与功能，但产出区块（*para-block*）的验证与终结由中继链验证人（*para-validators*）负责。*para-block* 需经 *para-validators* “批准”后才会被收录。独立的 *collator* 集合负责产出提交给 para-validators 的区块：
- *collator selection* 算法确定可产出 para-block 的 collator 集合。
- *block production* 算法定义在已选 collator 中，如何为某个 *slot* 选出出块者。

👉 Learn more about parachains [here](https://wiki.polkadot.network/docs/learn-parachains), and parathreads [here](https://wiki.polkadot.network/docs/learn-parathreads).

## Permissioned EVM

只有特定地址可以在 VFlow 部署合约，其他用户操作不受限。

### Gas-nomics

- VFlow 每个区块 gas 上限为 22.5M。
- gas 价格随网络拥堵（区块填充度）调整，规则与 zkVerify 的 fee multiplier [一致](https://research.web3.foundation/Polkadot/overview/token-economics#2-slow-adjusting-mechanism)。
- 为防止存储与平行链区块过度膨胀，对 gas 消耗做了进一步限制。

### Substrate - EVM Equivalence

需注意 VFlow 既是完整的 EVM 链，也是 Substrate 链，因此：
- 链默认暴露 EVM 地址，Substrate 与 EVM 地址的一一映射自动且透明完成。
- 也可连接 Substrate 钱包（仍使用 EVM 地址）调用 extrinsic 与 Substrate RPC。  
    - 这些 extrinsic 会正常执行并生效，但在 EVM 区块浏览器/监控工具中不会显示。
- 为避免上述情况，通过 Substrate extrinsic 发起 EVM 调用（Frontier pallet 原本支持）已被**禁用**。

## Governance

VFlow 目前没有去中心化治理或国库，由 *technical committee* 通过 *sudo* pallet 管理链并执行共识相关操作。

## Tokenomics

作为 zkVerify 的系统平行链，VFlow 共享原生代币 VFY：

- VFlow 无初始分配，也无固定供应。
- VFlow 不通过通胀增发或销毁。
- VFlow 流通代币仅限经 XCM 从 zkVerify 跨链而来。

## Consensus

- 目前 VFlow 依赖一组封闭的 collator（*Invulnerables*），不会被惩罚或移除，仅可通过治理增删，暂不开放其他 collator。
- VFlow 使用 [AURA](https://openethereum.github.io/Aura)（Authority Round）出块，即基于 PoA 的轮询选举，为给定 slot 选出出块 collator。
- 因无通胀，collator 奖励仅来自手续费：  
    - 所有手续费进入 *pot*。每个区块作者获得 pot 的一半。  
    该机制让奖励形成“滚动平均”，pot 作为缓冲和历史记忆，用以平滑收入：  
        - 若区块手续费异常高，作者仅拿当时 pot 的一半，剩余留给后续区块。  
        - 若区块手续费很低，作者仍可从现有 pot 获得奖励，维持参与。  
        - 若手续费较稳定，pot 会稳定在约 2 倍平均区块费，collator 奖励也会稳定在平均区块费附近。

### What to do next

- [连接钱包并在 VFlow 设置账户](./02-connect-a-wallet.md)
- [将 VFY 从 zkVerify Teleport 到 VFlow](./03-VFY-Bridging/01-token-teleport.md)
- [相关链接](./05-vflow-hub.md)
