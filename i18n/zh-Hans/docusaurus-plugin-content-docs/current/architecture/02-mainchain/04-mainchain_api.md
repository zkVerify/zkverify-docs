---
title: zkVerify 主链 API
slug: /architecture/mainchain/mainchain_api
---

# zkVerify 主链 API

主链节点暴露一组 API，提供链状态信息并用于发送命令（如创建交易）。

API 遵循 Substrate 典型格式，按以下类别组织：

- **[Runtime](#runtime)**
- **[JSON-RPC](#json-rpc)**
- **[Constants](#constants)**
- **[Storage](#storage)**
- **[Extrinsics](#extrinsics)**
- **[Events](#events)**
- **[Errors](#errors)**

除自定义验证 pallet 外，链上还使用以下标准 pallet：
<table>
  <tr>
    <td>BABE</td>
    <td>Balances</td>
    <td>Bounties</td>
    <td>ChildBounties</td>
    <td>Claim</td>
    <td>Configuration</td>
  </tr>
  <tr>
    <td>ConvictionVoting</td>
    <td>Coretime</td>
    <td>GRANDPA</td>
    <td>HRMP</td>
    <td>Initializer</td>
    <td>Ismp</td>
  </tr>
  <tr>
    <td>Ismp GRANDPA</td>
    <td>Multisig</td>
    <td>Offences</td>
    <td>Paras</td>
    <td>Preimage</td>
    <td>Proxy</td>
  </tr>
  <tr>
    <td>Referenda</td>
    <td>Registrar</td>
    <td>Scheduler</td>
    <td>Session</td>
    <td>Slots</td>
    <td>Staking</td>
  </tr>
  <tr>
    <td>Sudo</td>
    <td>Timestamp</td>
    <td>Token Gateway</td>
    <td>Transaction Payment</td>
    <td>Treasury</td>
    <td>Vesting</td>
  </tr>
  <tr>
    <td>Voterlist</td>
    <td>XcmPallet</td>
    <td></td>
    <td></td>
    <td></td>
    <td></td>
  </tr>
</table>

## [Runtime](#runtime)

可直接与主链 runtime 交互的调用，标准调用见 [官方文档](https://polkadot.js.org/docs/substrate/runtime)，实际可用性取决于主链配置与 pallet 集成。

## [JSON-RPC](#json-rpc)

RPC 可查询主链节点或提交命令，标准调用见 [官方文档](https://polkadot.js.org/docs/substrate/rpc)。

此外节点还暴露以下自定义命令：

### aggregate

#### [aggregate_statementPath](#aggregate_statementpath)

当触发 [`NewAggregationReceipt`](#newaggregationreceipt) 事件时，对应聚合已写入 [`Published`](#published) 存储。此 RPC 用于查询 [`Published`](#published) 获取聚合并生成你的证明的 Merkle 路径：

**Parameters**

- `at`: the block hash where the [`NewAggregationReceipt`](#newaggregationreceipt) event was emitted
- `domainId`: the domain's identifier
- `aggregationId`: the aggregation's identifier
- `statement`: the statement hash of your proof

**Returns**

`MerkleProof`

## [Constants](#constants)

标准常量见 [官方文档](https://polkadot.js.org/docs/substrate/constants)。

## [Storage](#storage)

可查询节点存储获取链状态。有些接口可返回历史数据（如特定区块验证人集合），取决于查询与节点配置（标准/归档）。标准方法见 [官方文档](https://polkadot.js.org/docs/substrate/storage)。

除此之外，提供以下自定义方法：

### aggregate

#### [nextDomainId](#nextdomainid)

下一个可用域标识符的值。

#### [domains](#domains)

域标识符到域数据的映射。

#### [published](#published)

包含当前区块所有 `(domainId, Aggregation)`，该存储每个新区块都会清空，聚合仅保留发布所在区块这一小段时间。生成聚合证明时需查询发布区块的存储值。

#### [SubmittersAllowlist](#submittersallowlist)

包含设置了 `OnlyAllowlisted` 的域可提交证明的账户列表。

## [Extrinsics](#extrinsics)

主链支持 Substrate 常用 extrinsic（见[官方文档](https://polkadot.js.org/docs/substrate/extrinsics)），此外还有以下自定义 extrinsic：

### aggregate

#### [aggregate](#aggregate_3)

发布聚合。用于发布处于待发布队列或未满的聚合。成功时处理聚合与派发的冻结资金。

- `Aggregation`：补偿调用 aggregate 的账户并提供激励
- `Delivery`：支付跨链派发成本给 delivery_owner

成功时触发 [`Event::NewAggregationReceipt`](#newaggregationreceipt)，如配置了派发则同步派发。

若聚合坐标无效/不存在，调用失败，仅收取检查所需的权重费用。

限制：

- 调用方需符合域的 `AggregateSecurityRules`
- 域必须存在
- 聚合存在且已可发布（已触发 AggregationComplete 事件）

参数：

- `domain_id`: 域标识符
- `aggregation_id`: 待发布聚合标识符

#### [registerDomain](#registerdomain)

注册新域，需冻结押金覆盖存储成本。请求账户成为域主且仅其可注销；[注销](#unregisterdomain) 后解锁押金并移除域。

成功时触发 [`Event::NewDomain`](#newdomain)。

限制：

- 调用方需有创建指定派发目标的权限  
  - 普通用户仅可 Destination::None  
  - 管理员可任意目标
- 必须指定 delivery owner（显式或默认调用者）
- 押金需足够覆盖存储，参考运行时 `AggregateBaseDeposit`、`AggregateByteDeposit`

参数：

- `aggregation_size`: 每个聚合的最大 statement 数
- `queue_size`: 可选，待发布聚合上限（默认取 runtime 配置）
- `aggregate_rules`: 聚合权限规则
- `proof_rules`: 提交权限规则
- `delivery`: 派发参数（目的地与价格）
- `delivery_owner`: 派发 owner（默认调用方）

#### [holdDomain](#holddomain)

将域置为 `Hold` 或 `Removable` 状态，仅域主可调用。调用后可能状态：

- `Hold`：域内仍有未发布聚合，或白名单非空
- `Removable`：无聚合待发布且白名单为空

进入 `Hold`/`Removable` 后不可再接收新证明，且无法回到 `Ready`。

**仅在 `Removable` 状态** 可调用 [`unregisterDomain`](#unregisterdomain) 移除。

状态变更时触发 [`DomainStateChanged`](#domainstatechanged)，若域非 `Ready` 或调用者非域主则失败。

若域使用白名单（`OnlyAllowlisted`），在变为 `Removable` 前请用 [`removeProofSubmitters`](#removeproofsubmitters) 清空。可通过 [`SubmittersAllowlist`](#submittersallowlist) 查看。

参数

- `domainId`: 域标识符。

#### [unregisterDomain](#unregisterdomain)

注销处于 `Removable` 的域，仅域主可调用，释放冻结资金。

参数

- `domainId`: 域标识符。

#### [setDeliveryPrice](#setdeliveryprice)

更新域的派发价格，调用方需为域主、delivery owner 或管理员。

参数

- `domain_id`: 域标识符
- `price`: 新的派发价格

#### [allowlistProofSubmitters](#allowlistproofsubmitters)

向域的白名单添加账户，需域主或管理员，域需配置为 `OnlyAllowlisted`。每个新增地址会为域主冻结少量资金覆盖存储。

参数

- `domain_id`: 域标识符
- `submitters`: 允许提交的账户列表

#### [removeProofSubmitters](#removeproofsubmitters)

从域白名单移除账户，需域主或管理员，域需 `OnlyAllowlisted`。移除会释放对应冻结金额。

参数

- `domain_id`: 域标识符
- `submitters`: 要移除的账户列表

### Verifier Pallets

所有 verifier pallet 共享以下接口并定义 vk、proof、public inputs 类型，提供的 extrinsic 有：

#### [submitProof](#submitproof)

提交 `Proof` 并依据 `Vk` 与 `Pubs` 验证，成功则纳入指定域的下一个聚合，无效则失败。

**参数**

- `vkOrHash: VkOrHash` 指定验证 key（`Vk`）或已注册 vkey 哈希（`H256`）。
- `proof: Proof` 待验证的证明。
- `Pubs: [u8;32]` 公共输入字节数组。
- `domainId: Option<u32>` 若非 `None`，则为要聚合的域 id，否则仅做验证。

#### [registerVk](#registervk)

注册验证 key，供后续提交使用，并触发携带 vk 哈希的 `RegisteredVk` 事件。

**参数**

- `vk: Vk` 要注册的 vkey。

#### [Available Verifier Pallets](#available-verifier-pallets)

- [settlementGroth16Pallet](#settlementgroth16pallet-types)
- [settlementRisc0Pallet](#settlementrisc0pallet-types)
- [settlementUltrahonkPallet](#settlementultrahonkpallet-types)
- [settlementUltraplonkPallet](#settlementultraplonkpallet-types)
- [settlementPlonky2Pallet](#settlementplonky2pallet-types)
- [settlementSp1Pallet](#settlementsp1pallet-types)
- [settlementEzklPallet](#settlementezklpallet-types)
- [settlementTeePallet](#settlementteepallet-types)

##### settlementGroth16Pallet Types

支持以太坊 _BN254_、以及 _BLS12-381_。`G1`/`G2` 点与标量编码详见 [Groth16 文档](../07-verification_pallets/04-groth16.md#encodings)

```rust
pub enum Curve {
    Bn254,
    Bls12_381,
}

pub struct G1(pub Vec<u8>); // 64 bytes for Bn256 and 96 for Bls12381
pub struct G2(pub Vec<u8>); // 128 bytes for Bn256 and 192 for Bls12381
pub struct Scalar(pub Vec<u8>); // 32 bytes

pub struct ProofInner {
    pub a: G1,
    pub b: G2,
    pub c: G1,
}

pub struct Proof {
    pub curve: Curve,
    pub proof: ProofInner,
}
pub struct Vk {
    pub curve: Curve,
    pub alpha_g1: G1,
    pub beta_g2: G2,
    pub gamma_g2: G2,
    pub delta_g2: G2,
    pub gamma_abc_g1: Vec<G1>,
}
pub type Pubs = Vec<Scalar>;
```

##### settlementRisc0Pallet Types

```rust
pub enum Proof {
    V1_0(Vec<u8>),
    V1_1(Vec<u8>),
    V1_2(Vec<u8>),
} // Limited on a configurable max size
pub type Vk = H256;
pub type Pubs = Vec<u8>;  // Limited on a configurable max size
```

#### settlementEzklPallet Types

```rust
pub type Proof = Vec<u8>; // Limited on a configurable max size
pub type Vk = Vec<u8>; // Limited on a configurable max size
pub type Pubs = Vec<[u8; 32]>;
```

#### settlementUltrahonkPallet Types

```rust
pub type Proof = Vec<u8>;
pub type Vk = [u8; 1760];
pub type Pubs = Vec<[u8; 32]>;
```

#### settlementUltraplonkPallet Types

```rust
pub type Proof = Vec<u8>;
pub type Vk = [u8; 1719];
pub type Pubs = Vec<[u8; 32]>;
```

#### settlementPlonky2Pallet Types

```rust
pub enum Plonky2Config {
    Keccak,
    #[default]
    Poseidon,
}

pub struct Proof<T> {
    pub compressed: bool,
    pub bytes: Vec<u8>,
    _marker: PhantomData<T>,
}
pub struct Vk<T> {
    pub config: Plonky2Config,
    pub bytes: Vec<u8>,
    _marker: PhantomData<T>,
}
pub type Pubs = Vec<u8>;
```

##### settlementSp1Pallet Types

```rust
pub type Proof = Vec<u8>;
pub type Vk = H256;
pub type Pubs = Vec<u8>;
```

#### settlementEzklPallet Types

```rust
pub type Proof = Vec<u8>;
pub type Vk = Vec<u8>;
pub type Pubs = Vec<[u8; 32]>;
```

#### settlementTeePallet Types

```rust
pub type Proof = Vec<u8>;  // TEE attestation quote, max 8192 bytes
pub type Pubs = Vec<u8>;   // Max 0 bytes — not used
pub struct Vk {
    pub tcb_response: Vec<u8>,   // TCB info JSON response, max 8192 bytes
    pub certificates: Vec<u8>,   // PEM-encoded certificate chain for TCB signature verification, max 8192 bytes
}
```

## [Events](#events)

主链使用 Substrate 标准事件（见 [官方文档](https://polkadot.js.org/docs/substrate/events)），另有自定义事件：

### aggregate

#### [NewDomain](#newdomain)

新域已注册。

##### Fields

- `id: u32` 新域的唯一标识

#### [DomainStateChanged](#domainstatechanged)

域状态变更

##### Fields

- `id: u32` 域标识
- `state: DomainState` 新状态

```rust
pub enum DomainState {
    /// Active and can receive new statements.
    Ready,
    /// Cannot receive new statements. Can just publish the aggregation that are
    /// already to be published queue.
    Hold,
    /// This Hold domain can be removed. There are no statements in this domain
    /// and it can be removed.
    Removable,
    /// This domain is removed.
    Removed,
}
```

#### [NewProof](#newproof)

域收到新的有效证明。

##### Fields

- `statement: H256` 证明的 statement 哈希
- `domainId: u32` 域标识
- `aggregationId: u64` 该域的唯一聚合标识

#### [AggregationComplete](#aggregationcomplete)

域 `domainId` 的聚合 `aggregationId` 已可发布。

##### Fields

- `domainId: u32` 域标识
- `aggregationId: u64` 该域的唯一聚合标识

#### [NewAggregationReceipt](#newaggregationreceipt)

域 `domainId` 的新聚合已生成并发布。

##### Fields

- `domainId: u32` 域标识
- `aggregationId: u64` 该域的唯一聚合标识
- `receipt: H256` 聚合凭证

#### [CannotAggregate](#newaggregationreceipt)

有效证明因故无法聚合

##### Fields

- `statement: H256` 证明的 statement 哈希
- `cause: CannotAggregateCause` 无法聚合的原因

```rust
/// The cause of a missed aggregation.
pub enum CannotAggregateCause {
    /// No account
    NoAccount,
    /// The requested domain doesn't exist.
    DomainNotRegistered {
        /// The domain identifier.
        domain_id: u32,
    },
    /// The domain's should publish queue is full.
    DomainStorageFull {
        /// The domain identifier.
        domain_id: u32,
    },
    /// The user doesn't have enough founds to hold balance for publication.
    InsufficientFunds,
    /// The domain's state is not valid.
    InvalidDomainState {
        /// The domain identifier.
        domain_id: u32,
        /// The domain state.
        state: DomainState,
    },
}
```

#### [DomainFull](#domainfull)

域 `domainId` 已满，需等待至少一个聚合发布后才能再聚合。

##### Fields

- `domainId: u32` 域标识

### Verifier Pallets

#### [VkRegistered](#vkregistered)

##### Fields

- `hash: H256` 已注册 vkey 的哈希，可在同 pallet 的 `submitProof` 中使用

#### [ProofVerified](#proofverified)

##### Fields

- `statement: H256` 该证明的 [statement](../03-proof-submission-interface.md#proof-submitter-flow) 哈希

## [Errors](#errors)

主链节点抛出 Substrate 标准错误（见 [官方文档](https://polkadot.js.org/docs/substrate/errors)），另定义以下自定义错误：

### aggregate

#### [BadOrigin](#badorigin)

调用方无权限

#### [UnknownDomainId](#unknowndomainid)

域标识不存在。

#### [InvalidAggregationId](#invalidaggregationid)

聚合坐标不存在。

#### [InvalidDomainParams](#invaliddomainparams)

域参数无效。

#### [InvalidDomainState](#invaliddomainstate)

尝试在非法状态下移除或挂起域。

#### [MissedDeliveryOwnership](#misseddeliveryownership)

未提供 delivery owner。

### Verifier Pallets

#### [InvalidInput](#invalidinput)

公共输入无效（无法反序列化）。

#### [InvalidProofData](#invalidproofdata)

证明无效（无法反序列化）。

#### [VerifyError](#verifyerror)

证明处理后验证失败。

#### [InvalidVerificationKey](#invalidverificationkey)

验证 key 无效。

#### [VerificationKeyNotFound](#verificationkeynotfound)

提交的 vk 哈希未关联任何已注册 vkey。
