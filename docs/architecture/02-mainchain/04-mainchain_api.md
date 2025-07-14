---
title: zkVerify Mainchain API
---

# zkVerify Mainchain API

Mainchain nodes expose some APIs to provide information about the chain status and endpoints to send commands (e.g. to create a new transaction).

APIs follow the Substrate typical format, and for this reason, they are categorized using the following categories:

- **[Runtime](#runtime)**
- **[JSON-RPC](#json-rpc)**
- **[Constants](#constants)**
- **[Storage](#storage)**
- **[Extrinsics](#extrinsics)**
- **[Events](#events)**
- **[Errors](#errors)**

## [Runtime](#runtime)

Some calls are available to interact directly with the Mainchain runtime.
All the standard calls are available in the [official documentation](https://polkadot.js.org/docs/substrate/runtime).
Availability of these calls may vary depending on the Mainchain runtime configuration and pallet integration.

## [JSON-RPC](#json-rpc)

RPC methods can be used to query the Mainchain node for information or to submit commands.
All the standard calls are available in the [official documentation](https://polkadot.js.org/docs/substrate/rpc).
Mainchain nodes currently expose only a subset of the Substrate RPC methods, in particular, the ones from the following pallets:

- _author_
- _chain_
- _childstate_
- _offchain_
- _payment_
- _rpc_
- _state_
- _system_

In addition to these, nodes expose the following custom commands:

### aggregate

#### [aggregate_statementPath](#aggregate_statementpath)

When a [`NewAggregationReceipt`](#newaggregationreceipt) event is emitted the aggregation pointed
by this event is published on the [`Published`](#published) storage. This RPC can be used to get
the Merkle proof of your proof by querying the [`Published`](#published) storage, retrieve the aggregation
and generate the proof:

**Parameters**

- `at`: the block hash where the [`NewAggregationReceipt`](#newaggregationreceipt) event was emitted
- `domainId`: the domain's identifier
- `aggregationId`: the aggregation's identifier
- `statement`: the statement hash of your proof

**Returns**

`MerkleProof`

## [Constants](#constants)

All the standard constants are available in the [official documentation](https://polkadot.js.org/docs/substrate/constants).
Mainchain nodes currently use only a subset of the Substrate constants, in particular, the ones from the following pallets:

- _balances_
- _grandpa_
- _staking_
- _system_
- _timestamp_
- _transactionPayment_

## [Storage](#storage)

The node's storage can be queried to retrieve information about the current chain state.
Some endpoints may return also historical data (e.g. the list of validators at a specific block), but availability depends on the specific query and the configuration of the node (e.g. standard vs archive node).
Standard methods are available in the [official documentation](https://polkadot.js.org/docs/substrate/storage).
Mainchain nodes currently use only a subset of these methods, in particular, the ones from the following pallets:

- _authorship_
- _babe_
- _balances_
- _grandpa_
- _offences_
- _session_
- _staking_
- _substrate_
- _sudo_
- _system_
- _timestamp_
- _transactionPayment_

In addition to them, the following custom methods are available:

### aggregate

#### [nextDomainId](#nextdomainid)

The value of the next valid free domain's identifier.

#### [domains](#domains)

The map from domain identifiers to the domain data.

#### [published](#published)

Contains a vector of tuple `(domainId, Aggregation)` of all aggregations
published in a block. This storage is cleaned **every** new block, that means every
aggregation is present in this storage for **just one block**: the one where it
has been aggregated. In order to create the aggregation proof you should inspect the storage
value at the block where it has been published.

## [Extrinsics](#extrinsics)

Mainchain nodes support some of the most common extrinsics provided by Substrate (see the [official documentation](https://polkadot.js.org/docs/substrate/extrinsics)).
The pallet currently included in the runtime are:

- _balances_
- _grandpa_
- _imOnline_
- _session_
- _staking_
- _sudo_
- _system_
- _timestamp_

In addition to them, the following custom extrinsics are available:

### aggregate

#### [aggregate](#aggregate_3)

Publish the aggregation. This call is used to publish a new aggregation that is in
the domain both in to be published queue or is still not completed.
If everything is fine, it processes held funds for aggregation and delivery

- `Aggregation`: Compensates the aggregator (the account calling the aggregate extrinsic) for the transaction costs and provides incentive.
- `Delivery`: Pays for the cross-chain dispatch costs to the delivery_owner account

In case everything is fine a [`Event::NewAggregationReceipt`](#newaggregationreceipt) is emitted.
It also dispatches the aggregation to its destination if configured

If the aggregation coordinates are not valid and don't indicate an existing aggregation,
the call will fail, but the weight cost charged to the caller is just the one needed to do the checks.

Restrictions:

- Origin must be authorized according to the domain's `AggregateSecurityRules`
- Domain must exist
- Aggregation must exist and be ready for publication (i.e. an event AggregationComplete must’ve been emitted)

Arguments:

- `domain_id`: Domain identifier
- `aggregation_id`: Identifier of the aggregation to publish

#### [registerDomain](#registerdomain)

Register a new domain. It holds a deposit to cover the cost of all the storage that the domain needs.
The account that requested this domain will be the owner and is the only one that can unregister it.
[Unregister the domain](#unregisterdomain) will free the held funds and remove the domain from the system.

If everything is fine a [`Event::NewDomain`](#newdomain) is emitted.

Restrictions:

- Origin must be authorized to create domains with the specified delivery destination
  - Regular users (anyone with a signed account) can only register domains with Destination::None
  - Managers can register domains with any destination type
- Delivery owner must be specified (either explicitly or by caller)
- Sufficient funds must be available for the domain storage deposit. Please refer to the runtime config types `AggregateBaseDeposit` and `AggregateByteDeposit`

Arguments:

- `aggregation_size`: Maximum number of statements per aggregation
- `queue_size`: Optional maximum number of pending aggregations (defaults to runtime configuration)
- `aggregate_rules`: Security rules for controlling who can aggregate
- `delivery`: Parameters for delivery (destination and price) At the moment destination can only be either None or Hyperbridge
- `delivery_owner`: The delivery owner, as discussed in the previous section (defaults to origin).

#### [holdDomain](#holddomain)

Hold a domain. Put the domain in `Hold` or `Removable` [state](#domainstatechanged). Only the domain owner can call it.
Once you call this function the domain state could be:

- `Hold`: If there are some aggregations in this domain that are not aggregated yet.
- `Removable`: If the domain is ready to be removed because there are no more aggregations to be aggregated.

Once the domain go in `Hold` or `Removabe` state cannot receive new proofs at all and cannot become in the `Ready`
state again.

**Only when the domain is in `Removable` state** you can call [`unregisterDomain`](#unregisterdomain) extrinsic
to remove it definitely.

The [`DomainStateChanged`](#domainstatechanged) event is emitted when the domain changes its state. This call fails
if the domain is not in `Ready` state or if the caller is not the domain's owner.

Arguments

- `domainId`: The domain's identifier.

#### [unregisterDomain](#unregisterdomain)

Unregister a domain in `Removable` [state](#domainstatechanged). Only the domain owner can call it. All funds that the
domain owner holds on this domain are unlocked.

Arguments

- `domainId`: The domain's identifier.

#### [setDeliveryPrice](#setdeliveryprice)

Updates the delivery price for a domain.
Origin must be domain owner, delivery owner, or manager

Arguments

- `domain_id`: Domain identifier
- `price`: New delivery price

### Verifier Pallets

All verifier pallets share the following interface and define its types for: verification key, proof and public inputs. Anyway the
available extrinsics are:

#### [submitProof](#submitproof)

Submit a `Proof` and verify it against the verification key `Vk` and public inputs `Pubs`. If the proof is valid it'll be included
in the next aggregation within the given domain. The extrinsic fails in the case of an invalid proof.

**Parameters**

- `vkOrHash: VkOrHash` indicates the verification key (the pallet's `Vk`) or the hash (`H256`) of a preregistered one.
- `proof: Proof` the proof to be verified.
- `Pubs: [u8;32]` The byte array representing the public inputs.
- `domainId: Option<u32>` if is not `None` the domain's identifier where aggregating the proof, otherwise the proof is just verified.

#### [registerVk](#registervk)

Register a verification key that can be used later in submit proof calls and emit a `RegisteredVk` event with the verification key hash.

**Parameters**

- `vk: Vk` the verification key that should be registered.

#### [Available Verifier Pallets](#available-verifier-pallets)

- [settlementGroth16Pallet](#settlementgroth16pallet-types)
- [settlementRisc0Pallet](#settlementrisc0pallet-types)
- [settlementUltraplonkPallet](#settlementultraplonkpallet-types)
- [settlementPlonky2Pallet](#settlementplonky2pallet-types)
- [settlementSp1Pallet](#settlementsp1pallet-types)

##### settlementGroth16Pallet Types

Support is provided for both the _BN254_ curve used in Ethereum, and the _BLS12-381_ curve. The details about how `G1`/`G2` elliptic
curve points and scalars are actually encoded can be found in the
[Groth16 pallet documentation](../07-verification_pallets/04-groth16.md#encodings)

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

#### settlementUltraplonkPallet Types

```rust
pub type Proof = Vec<u8>;
pub type Vk = [u8; 1719];
pub type Pubs = [u8; 32];
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

## [Events](#events)

The Mainchain leverages the standard Events provided by Substrate (see the [official documentation](https://polkadot.js.org/docs/substrate/events)).
In addition to them, the following custom events are available:

### aggregate

#### [NewDomain](#newdomain)

A new domain was registered.

##### Fields

- `id: u32` The new domain unique identifier

#### [DomainStateChanged](#domainstatechanged)

The domain state is changed

##### Fields

- `id: u32` domain id
- `state: DomainState` The new state

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

New valid proof submitted for a domain.

##### Fields

- `statement: H256` The proof statement hash
- `domainId: u32` Domain identifier
- `aggregationId: u64` The unique aggregation identifier for the domain

#### [AggregationComplete](#aggregationcomplete)

Aggregation `aggregationId` in domain `domainId` is ready to be published.

##### Fields

- `domainId: u32` Domain identifier
- `aggregationId: u64` The unique aggregation identifier for the domain

#### [NewAggregationReceipt](#newaggregationreceipt)

A new aggregation for the domain `domainId` was generated and published.

##### Fields

- `domainId: u32` Domain identifier
- `aggregationId: u64` The unique aggregation identifier for the domain
- `receipt: H256` The aggregation receipt

#### [CannotAggregate](#newaggregationreceipt)

The given valid proof cannot be aggregated for some reason

##### Fields

- `statement: H256` The proof statement hash
- `cause: CannotAggregateCause` The reason for which it was not possible to add this proof

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

The Domain `domainId` is full, no new other proofs can be aggregated in this domain
till at least one aggregation is published

##### Fields

- `domainId: u32` Domain identifier

### Verifier Pallets

#### [VkRegistered](#vkregistered)

##### Fields

- `hash: H256` The hash of the registered verification key that can be used later in the `submitProof`
  exstrinsic calls of the same verifier pallet

#### [ProofVerified](#proofverified)

##### Fields

- `statement: H256` The [statement](../03-proof-submission-interface.md#proof-submitter-flow)
  hash of the verified proof

## [Errors](#errors)

The Mainchain nodes throw the standard errors provided by Substrate (see the [official documentation](https://polkadot.js.org/docs/substrate/errors)).

In addition to them, the following custom errors have been defined:

### aggregate

#### [BadOrigin](#badorigin)

If caller lacks permission

#### [UnknownDomainId](#unknowndomainid)

It doesn't exist any domain with this identifier.

#### [InvalidAggregationId](#invalidaggregationid)

The provided aggregation coordinate doesn't refer to any available aggregation.

#### [InvalidDomainParams](#invaliddomainparams)

The given domain parameters are invalid.

#### [InvalidDomainState](#invaliddomainstate)

Try to remove or put on hold a domain from an invalid state.

#### [MissedDeliveryOwnership](#misseddeliveryownership)

If no delivery owner is provided

### Verifier Pallets

#### [InvalidInput](#invalidinput)

Error thrown when the submitted public inputs are invalid (i.e. it was not possible to deserialize the raw bytes).

#### [InvalidProofData](#invalidproofdata)

Error thrown when the submitted proof is invalid (i.e. it was not possible to deserialize the raw bytes).

#### [VerifyError](#verifyerror)

Error thrown when the submitted proof is processed but the verification fails.

#### [InvalidVerificationKey](#invalidverificationkey)

Error thrown when the submitted verification key is invalid.

#### [VerificationKeyNotFound](#verificationkeynotfound)

Error thrown when submitting a vk hash that is not related to any registered verification key.
