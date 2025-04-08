---
title: Functionality
---

# Functionality

## Overview

The zkVerify Smart Contract is deployed on different chains, where it receives an attestation from the zkVerify authorized relayer.

Currently, it's deployed to the following chains

| Chain | Contract Address                                                                                                                       |
|------|----------------------------------------------------------------------------------------------------------------------------------------| 
| Ethereum Sepolia    | [0xEA0A0f1EfB1088F4ff0Def03741Cb2C64F89361E](https://sepolia.etherscan.io/address/0xEA0A0f1EfB1088F4ff0Def03741Cb2C64F89361E)          |
| Arbitrum Sepolia    | [0xd007494945580eEb25522c8e0b2fa798B3F0FDE2](https://sepolia.arbiscan.io/address/0xd007494945580eEb25522c8e0b2fa798B3F0FDE2)           | 
| Optimism sepolia| [0xBBa17b0Eb3DdF0631c0Cce00E4245E4A2EE49982](https://sepolia-optimism.etherscan.io/address/0xBBa17b0Eb3DdF0631c0Cce00E4245E4A2EE49982) |
| Base Sepolia    | [0x0807C544D38aE7729f8798388d89Be6502A1e8A8](https://sepolia.basescan.org//address/0x0807C544D38aE7729f8798388d89Be6502A1e8A8)         |

## Storage Variables

The zkVerify Smart Contract keeps the aggregations as storage variables:

```solidity
// Mapping of domain Ids to aggregationIds to proofsAggregations.
mapping(uint256 => mapping(uint256 => bytes32)) public proofsAggregations;
```

## Methods

### Submit Aggregation Method (for bot only)

```solidity
function submitAggregation(
    uint256 _domainId,
    uint256 _aggregationId,
    bytes32 _proofsAggregation
)external onlyRole(OPERATOR);
```

- Adds a new entry to the mapping using aggregationId and domainId and stores the proofsAggregation.
- Emits a new AggregationPosted(domainId, aggregationId, proofsAggregation) event.

### Submit Aggregations Batch Method (for bot only)

This method is used in the situation when multiple aggregations have been published on zkVerify while the relayer is down but recovers later on.

```solidity
function submitAggregationBatchByDomainId(
    uint256 _domainId,
    uint256[] calldata _aggregationIds,
    bytes32[] calldata _proofsAggregations
) external onlyRole(OPERATOR) 
```

- Checks that `_aggregationIds.len() == _proofsAggregations.len()`.
- Invokes the `registerAggregation` internal method multiple times.

It’s a bit cheaper than calling submitAggregation externally multiple times, as you’ll pay the initial gas fee only one time.   Additionally, it avoids edge cases related to Ethereum nonce management.

### onAccept Method (submit aggregation for Hyperbridge only)

This method receives hyperbridge message containing an aggregation and is defined by Hyperbridge interface

```solidity
function onAccept(IncomingPostRequest memory incoming) external override onlyHost
```

- Parse and unpacks message payload to get domainId, aggregationId, and proofsAggregation
- Invokes the `registerAggregation` internal method.

### Verify Proof Attestation Method

This method is used by proof submitters’ contracts to verify that their proof has been attested by a published attestation.

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

- Checks `__aggregationId` exists in the `proofsAggregations` storage mapping.
- Returns `Merkle.verifyProofKeccak(proofsAggregation, _merklePath, _leafCount, _index, _leaf)`

The verification of the Merkle path is carried out by employing the [Merkle.sol](https://github.com/HorizenLabs/cdk-validium-contracts/blob/0.1.1/contracts/lib/Merkle.sol) library contract provided by **EigenDA**. We preferred this choice over OpenZeppelin, as it is assuming that both leaves and internal nodes are ordered lexicographically, which is something not necessarily true for us.  Moreover, **EigenDA** implementation is more optimized.

However, such implementation needs to be modified to accommodate the fact that Substrate uses a slightly optimized version of a Binary Merkle tree, while the contract assumes the Merkle tree to be always complete and balanced. Please refer to the Substrate [source code](https://github.com/paritytech/polkadot-sdk/blob/b0741d4f78ebc424c7544e1d2d5db7968132e577/substrate/utils/binary-merkle-tree/src/lib.rs#L237) for more info.
