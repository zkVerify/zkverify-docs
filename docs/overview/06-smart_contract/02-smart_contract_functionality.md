---
title: Functionality
---

# Functionality

## Overview

The zkVerify Smart Contract is deployed on [different chains](../introduction_what_is_zkverify/core_components#attestation-mechanism), where it receives an attestation from the zkVerify authorized relayer.

## Storage Variables

The zkVerify Smart Contract keeps the attestations as storage variables:

```solidity
mapping(uint256 => bytes32) public proofsAttestations;
```

## Methods

### Submit Attestation Method

```solidity
function submitAttestation(
   uint256 _attestationId,
   bytes32 _proofsAttestation
)external onlyRole(ADMIN);
```

- Verifies that the attestation id is incremental (`newAttestationId = latestAttestationId + 1`) if and only if this check is enabled.
- Adds a new entry to the mapping using the newAttestationId and storing the newAttestation.
- Emits a new AttestationPosted(attestationId, attestation) event.

### Submit Attestations Batch Method

This method is used in the situation when multiple attestations have been published on zkVerify while the relayer is down but recovers later on.

```solidity
function submitAttestationsBatch(
   uint256[] _attestationIds,
   bytes32[] _proofsAttestations
)external onlyRole(ADMIN);
```

- Checks that `_attestationIds.len() == _proofsAttestations.len()`.
- Invokes the `submitAttestation` method multiple times.

It’s a bit cheaper than calling submitAttestation externally multiple times, as you’ll pay the initial gas fee only one time.   Additionally, it avoids edge cases related to Ethereum nonce management.

### Verify Proof Attestation Method

This method is used by proof submitters’ contracts to verify that their proof has been attested by a published attestation.

```solidity
function verifyProofAttestation(
      uint256 _attestationId,
      bytes32 _leaf,
      bytes calldata _merklePath,
      uint32 _number_of_leaves,
      uint256 _index
   ) external view returns (bool)
```

- Checks `_attestationId` exists in the `proofsAttestations` storage mapping.
- Computes `claimedAttestation = apply(_leaf, _merklePath, _index)`.
- Returns `claimedAttestation ==  proofsAttestation[_attestationId]`.

The verification of the Merkle path is carried out by employing the [Merkle.sol](https://github.com/HorizenLabs/cdk-validium-contracts/blob/0.1.1/contracts/lib/Merkle.sol) library contract provided by **EigenDA**. We preferred this choice over OpenZeppelin, as it is assuming that both leaves and internal nodes are ordered lexicographically, which is something not necessarily true for us.  Moreover, **EigenDA** implementation is more optimized.

However, such implementation needs to be modified to accommodate the fact that Substrate uses a slightly optimized version of a Binary Merkle tree, while the contract assumes the Merkle tree to be always complete and balanced. Please refer to the Substrate [source code](https://github.com/paritytech/polkadot-sdk/blob/b0741d4f78ebc424c7544e1d2d5db7968132e577/substrate/utils/binary-merkle-tree/src/lib.rs#L237) for more info.
