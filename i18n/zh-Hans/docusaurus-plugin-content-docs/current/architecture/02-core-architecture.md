import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 核心架构

![alt_text](./img/zkVerify-workflow.jpg)

## 核心区块链

我们的链是基于 Substrate 的 L1 PoS 区块链，专注 zk 证明验证，内置多种验证 Pallet。链上使用 VFY 代币，验证证明需消耗 VFY。

## 证明提交接口

链的入口，用户在此提交交易与调用 RPC。我们提供 SDK [zkVerifyJS](https://docs.zkverify.io/overview/getting-started/zkverify-js)，便于通过简洁代码注册 vkey、提交 zk 证明、监听事件、获取聚合信息等。

## 证明凭证机制

证明验证完成并上链后，经聚合机制生成证明凭证，为该批已验证证明的 Merkle 根。凭证由中继发布到目标链（如以太坊）上的合约。

## 聚合引擎

聚合系统设计为无许可，任何人可发布聚合并获得费用。可定义多个聚合域，各自有聚合规模；提交者可选择目标域。

## 链上验证

用户向链上 zkVerify 合约提交 Merkle 证明，以验证其证明已在 zkVerify 链上通过。当前合约部署在：

<Tabs groupId="networks">
<TabItem value="mainnet" label="Mainnet">
- Base  
</TabItem>
<TabItem value="testnet" label="Testnet">
- Sepolia Testnet
- Base Sepolia Testnet
- Arbitrum Sepolia Testnet
- Optimism Sepolia Testnet
- EDU Chain Testnet
</TabItem>
</Tabs>

## Verifier Pallets

我们为不同证明方案提供内置 verifier pallet，支持多种 zk 证明。提交接口将请求分发给对应 pallet 进行验证并上链。目前支持：

- Groth16 (Circom, SnarkJS, Gnark)
- EZKL
- UltraHonk (Noir)
- UltraPlonk (Noir)
- Risc Zero
- Plonky2
- SP1
