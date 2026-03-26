---
title: 证明验证智能合约
---

# 功能

## Overview

zkVerify 智能合约部署在多条链上，由授权 relayer 提交聚合。部署链列表见[此处](../handbook/99-resources/01-useful-links.md)。

## Storage Variables

合约以存储变量保存聚合：

```solidity
// Mapping of domain Ids to aggregationIds to proofsAggregations.
mapping(uint256 => mapping(uint256 => bytes32)) public proofsAggregations;
```

## 方法

### 提交单个聚合（仅 bot）

```solidity
function submitAggregation(
    uint256 _domainId,
    uint256 _aggregationId,
    bytes32 _proofsAggregation
)external onlyRole(OPERATOR);
```

- 以 aggregationId、domainId 写入映射，存 proofsAggregation
- 触发 AggregationPosted(domainId, aggregationId, proofsAggregation)

### 批量提交聚合（仅 bot）

用于中继故障后恢复，批量提交已在 zkVerify 发布的聚合。

```solidity
function submitAggregationBatchByDomainId(
    uint256 _domainId,
    uint256[] calldata _aggregationIds,
    bytes32[] calldata _proofsAggregations
) external onlyRole(OPERATOR) 
```

- 校验 `_aggregationIds.len() == _proofsAggregations.len()`
- 多次调用内部 `registerAggregation`

相比多次调用 submitAggregation 更省 gas（只付一次基础费用），也避免以太坊 nonce 管理边界情况。

### Verify Proof Aggregation

供提交者的合约验证其证明已被发布的聚合认可。

```solidity
function verifyProofAggregation(
    uint256 _domainId,
    uint256 _aggregationId,
    bytes32 _leaf,
    bytes32[] calldata _merklePath,
    uint256 _leafCount,
    uint256 _index
   ) external view returns (bool)
```

- 检查 `proofsAggregations` 映射存在 `__aggregationId`
- 返回 `Merkle.verifyProofKeccak(proofsAggregation, _merklePath, _leafCount, _index, _leaf)`

Merkle 路径验证使用 **EigenDA** 提供的 [Merkle.sol](https://github.com/zkVerify/zkv-attestation-contracts/blob/main/contracts/lib/Merkle.sol) 库。相较 OZ，该实现假设叶子与内部节点按字典序排序（更契合我们的需求）且更优化。

不过需修改以适配 Substrate 使用的优化二叉 Merkle 树，而合约假设完全平衡。详见 Substrate [源码](https://github.com/paritytech/polkadot-sdk/blob/b0741d4f78ebc424c7544e1d2d5db7968132e577/substrate/utils/binary-merkle-tree/src/lib.rs#L237)。
