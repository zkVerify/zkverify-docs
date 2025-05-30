---
title: Smart Contract Verification
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

In this tutorial we will be developing a smart contract which verifies the aggregation proof by calling the zkVerify contract. We will be using Remix toolkit to develop the smart contract which will have the interface to verify our aggregations. Also we have a [foundry template](https://github.com/zkVerify/zkverify-evm-dapp-example) you can check out.

First we need to create an interface to interact with zkVerify smart contracts. Create a new file called as ``IVerifyProofAggregation.sol`` and use the following code snippet to create the interface :

```solidity
// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.20;

interface IVerifyProofAggregation {
    function verifyProofAggregation(
        uint256 _domainId,
        uint256 _aggregationId,
        bytes32 _leaf,
        bytes32[] calldata _merklePath,
        uint256 _leafCount,
        uint256 _index
    ) external view returns (bool);
}
```

After this, we are ready to create our main contract which will verify aggregation proofs and can perform any function as per the business logic. To get started first we declare our proving system which can be different for each proof type, this will be used while generating the leaf digest to verify the aggregation.

<Tabs groupId="proving-id">
<TabItem value="circom" label="Circom">
```solidity
bytes32 public constant PROVING_SYSTEM_ID = keccak256(abi.encodePacked("groth16"));
```

</TabItem>
<TabItem value="r0" label="Risc Zero">
```solidity
bytes32 public constant PROVING_SYSTEM_ID = keccak256(abi.encodePacked("risc0"));
```
</TabItem>
<TabItem value="noir" label="Noir">
```solidity
bytes32 public constant PROVING_SYSTEM_ID = keccak256(abi.encodePacked("ultraplonk"));
```
</TabItem>
</Tabs>

Next we would need to declare the prover version, we want to verify the aggregation for. This is useful as we support multiple prover version for different proof types. 
<Tabs>
<TabItem value="circom" label="Circom">
```solidity
bytes32 public constant VERSION_HASH = sha256(abi.encodePacked(""));
```

</TabItem>
<TabItem value="r0" label="Risc Zero">
```solidity
bytes32 public constant VERSION_HASH = sha256(abi.encodePacked("risc0:v1.1"));
```
</TabItem>
<TabItem value="noir" label="Noir">
```solidity
bytes32 public constant VERSION_HASH = sha256(abi.encodePacked(""));
```
</TabItem>
</Tabs>


We will also need to store the some details like zkVerifier contract address and vkey. We will initialize these values with the constructor.

<Tabs groupId="constructor">
<TabItem value="circom" label="Circom">
```solidity
// zkVerify contract
    address public zkVerify;

    // vkey for our circuit
    bytes32 public vkey;

    constructor(address _zkVerify, bytes32 _vkey) {
        zkVerify = _zkVerify;
        vkey = _vkey;
    }
```
</TabItem>
<TabItem value="r0" label="Risc Zero">
```solidity
// zkVerify contract
    address public zkVerify;

    // vkey for our circuit
    bytes32 public vkey;


    constructor(address _zkVerify, bytes32 _vkey) {
        zkVerify = _zkVerify;
        vkey = _vkey;
    }
```
</TabItem>
<TabItem value="noir" label="Noir">
```solidity
// zkVerify contract
    address public zkVerify;

    // vkey for our circuit
    bytes32 public vkey;

    constructor(address _zkVerify, bytes32 _vkey) {
        zkVerify = _zkVerify;
        vkey = _vkey;
    }
```
</TabItem>
</Tabs>

Now we can move to the verification part, where can call the zkVerify’s contract to check if the aggregation proof is really correct. We need to get the following to verify the proof :- 

- Aggregation ID
- Domain ID
- Public Inputs
- Merkle Proof
- Number of Leaves
- Leaf Index

We can get all the above data except the public inputs from the aggregation.json file, we have generated earlier. User can provide the public inputs to the verify function which we can use to create the leaf digest. We need to pass the public inputs hash we got while generating proof(You can find this in proof.json file). To create the final leaf we need the hash of proving system, vkey, version hash and the combined hash of public inputs.

<Tabs groupId="leaf-digest">
<TabItem value="circom" label="Circom">
There are certain things we need to consider before moving forward, as all the public inputs in a circom circuit are field elements which can be considered as uint256 in Solidity’s context. But zkVerify’s verifier pallets uses big endian encoding but EVM uses little endian encoding, so we need a helper function to convert it. This is only needed for groth16 proofs. To make it easier, we have provided the required code snippet below :

```solidity
function _changeEndianess(uint256 input) internal pure returns (uint256 v) {
        v = input;
        // swap bytes
        v =
            ((v &
                0xFF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00) >>
                8) |
            ((v &
                0x00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF) <<
                8);
        // swap 2-byte long pairs
        v =
            ((v &
                0xFFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000) >>
                16) |
            ((v &
                0x0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF) <<
                16);
        // swap 4-byte long pairs
        v =
            ((v &
                0xFFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000) >>
                32) |
            ((v &
                0x00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF) <<
                32);
        // swap 8-byte long pairs
        v =
            ((v &
                0xFFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF0000000000000000) >>
                64) |
            ((v &
                0x0000000000000000FFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF) <<
                64);
        // swap 16-byte long pairs
        v = (v >> 128) | (v << 128);
    }
```
```solidity
bytes32 leaf = keccak256(abi.encodePacked(PROVING_SYSTEM_ID, vkey, VERSION_HASH, keccak256(abi.encodePacked(_changeEndianess(_hash)))));
```
</TabItem>
<TabItem value="r0" label="Risc Zero">
```solidity
bytes32 leaf = keccak256(abi.encodePacked(PROVING_SYSTEM_ID, vkey, VERSION_HASH, keccak256(abi.encodePacked(_hash))));
```
</TabItem>
<TabItem value="noir" label="Noir">
```solidity
bytes32 leaf = keccak256(abi.encodePacked(PROVING_SYSTEM_ID, vkey, VERSION_HASH, keccak256(abi.encodePacked(_input))));
```
</TabItem>
</Tabs>


After generating the leaf digest, we can call the zkVerify contracts to verify our attestation proof and for this we will use the interface that we created earlier.

<Tabs groupId="check-proof">
<TabItem value="circom" label="Circom">
```solidity
function checkHash(
    uint256 _hash,
    uint256 _aggregationId,
    uint256 _domainId,
    bytes32[] calldata _merklePath,
    uint256 _leafCount,
    uint256 _index
) public {

    bytes32 leaf = keccak256(abi.encodePacked(PROVING_SYSTEM_ID, vkey, VERSION_HASH, keccak256(abi.encodePacked(_changeEndianess(_hash)))));

    require(IVerifyProofAggregation(zkVerify).verifyProofAggregation(
        _domainId,
        _aggregationId,
        leaf,
        _merklePath,
        _leafCount,
        _index
    ), "Invalid proof");
}
```
</TabItem>
<TabItem value="r0" label="Risc Zero">
```solidity
function checkHash(
    bytes memory _hash,
    uint256 _aggregationId,
    uint256 _domainId,
    bytes32[] calldata _merklePath,
    uint256 _leafCount,
    uint256 _index
) public {

    bytes32 leaf = keccak256(abi.encodePacked(PROVING_SYSTEM_ID, vkey, VERSION_HASH, keccak256(abi.encodePacked(_hash))));

    require(IVerifyProofAggregation(zkVerify).verifyProofAggregation(
        _domainId,
        _aggregationId,
        leaf,
        _merklePath,
        _leafCount,
        _index
    ), "Invalid proof");
}
```
</TabItem>
<TabItem value="noir" label="Noir">
```solidity
function checkHash(
    bytes32 _hash,
    uint256 _aggregationId,
    uint256 _domainId,
    bytes32[] calldata _merklePath,
    uint256 _leafCount,
    uint256 _index
) public {

    bytes32 leaf = keccak256(abi.encodePacked(PROVING_SYSTEM_ID, vkey, VERSION_HASH, keccak256(abi.encodePacked(_hash))));

    require(IVerifyProofAggregation(zkVerify).verifyProofAggregation(
        _domainId,
        _aggregationId,
        leaf,
        _merklePath,
        _leafCount,
        _index
    ), "Invalid proof");
}
```
</TabItem>
</Tabs>

