---
title: 智能合约验证
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

本教程将开发一个智能合约，通过调用 zkVerify 合约验证聚合证明。使用 Remix 开发合约，并暴露验证接口；也可参考我们的 [foundry 模板](https://github.com/zkVerify/zkverify-evm-dapp-example)。

先创建与 zkVerify 合约交互的接口。新建 ``IVerifyProofAggregation.sol``，使用：

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

随后编写主合约，完成聚合验证并加入业务逻辑。首先声明 proving system，每种证明类型不同，用于生成 leaf digest：

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
<TabItem value="ultrahonk" label="Ultrahonk">
```solidity
bytes32 public constant PROVING_SYSTEM_ID = keccak256(abi.encodePacked("ultrahonk"));
```
</TabItem>
<TabItem value="ultraplonk" label="Ultraplonk">
```solidity
bytes32 public constant PROVING_SYSTEM_ID = keccak256(abi.encodePacked("ultraplonk"));
```
</TabItem>
<TabItem value="sp1" label="SP1">
```solidity
bytes32 public constant PROVING_SYSTEM_ID = keccak256(abi.encodePacked("sp1"));
```
</TabItem>
</Tabs>

接着声明 prover 版本，便于区分不同证明类型的多个版本。
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
<TabItem value="ultrahonk" label="Ultrahonk">
```solidity
bytes32 public constant VERSION_HASH = sha256(abi.encodePacked(""));
```
</TabItem>
<TabItem value="ultraplonk" label="Ultraplonk">
```solidity
bytes32 public constant VERSION_HASH = sha256(abi.encodePacked(""));
```
</TabItem>
<TabItem value="sp1" label="SP1">
```solidity
bytes32 public constant VERSION_HASH = sha256(abi.encodePacked(""));
```
</TabItem>
</Tabs>


需存储 zkVerifier 合约地址与 vkey，在构造函数中初始化：

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
<TabItem value="ultrahonk" label="Ultrahonk">
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
<TabItem value="ultraplonk" label="Ultraplonk">
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
<TabItem value="sp1" label="SP1">
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

接下来实现验证：调用 zkVerify 合约检查聚合证明。需要：

- Aggregation ID
- Domain ID
- Public Inputs
- Merkle Proof
- Number of Leaves
- Leaf Index

除 public inputs 外，其余可从之前生成的 aggregation.json 获得。用户将 public inputs 传入验证函数，用于构造 leaf digest。需传入生成证明时的 public inputs 哈希（见 proof.json）。最终 leaf 由 proving system hash、vkey、version hash、public inputs 合并哈希组成。**注意：如使用 Kurier 提供的聚合数据，可跳过此步。**

<Tabs groupId="leaf-digest">
<TabItem value="circom" label="Circom">
需要注意，circom 的 public inputs 是字段元素，在 Solidity 中可视为 uint256；zkVerify verifier pallet 使用大端，EVM 用小端，因此 Groth16 需做端序转换，示例：

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
<TabItem value="ultrahonk" label="Ultrahonk">
```solidity
bytes32 leaf = keccak256(abi.encodePacked(PROVING_SYSTEM_ID, vkey, VERSION_HASH, keccak256(abi.encodePacked(_input))));
```
</TabItem>
<TabItem value="ultraplonk" label="Ultraplonk">
```solidity
bytes32 leaf = keccak256(abi.encodePacked(PROVING_SYSTEM_ID, vkey, VERSION_HASH, keccak256(abi.encodePacked(_input))));
```
</TabItem>
<TabItem value="sp1" label="SP1">
```solidity
bytes32 leaf = keccak256(abi.encodePacked(PROVING_SYSTEM_ID, vkey, VERSION_HASH, keccak256(abi.encodePacked(_hash))));
```
</TabItem>
</Tabs>


生成 leaf digest 后，调用 zkVerify 合约验证 attestation，使用先前的接口即可。

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
<TabItem value="ultrahonk" label="Ultrahonk">
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
<TabItem value="ultraplonk" label="Ultraplonk">
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
<TabItem value="sp1" label="SP1">
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
</Tabs>
