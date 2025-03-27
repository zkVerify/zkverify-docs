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

- *author*
- *chain*
- *childstate*
- *offchain*
- *payment*
- *rpc*
- *state*
- *system*

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

### poe

#### [poe_proofPath](#poe_proofpath)

Given the hash of a proof and the id of the attestation in which it is included, returns the path of the proof in the Merkle tree.
In case the proof is not found, an error is returned.

**Parameters**

- `attestation_id: u64`
- `proof_hash: H256`

**Returns**

`MerkleProof`

## [Constants](#constants)

All the standard constants are available in the [official documentation](https://polkadot.js.org/docs/substrate/constants).
Mainchain nodes currently use only a subset of the Substrate constants, in particular, the ones from the following pallets:

- *balances*
- *grandpa*
- *imOnline*
- *staking*
- *system*
- *timestamp*
- *transactionPayment*

## [Storage](#storage)

The node's storage can be queried to retrieve information about the current chain state.
Some endpoints may return also historical data (e.g. the list of validators at a specific block), but availability depends on the specific query and the configuration of the node (e.g. standard vs archive node).
Standard methods are available in the [official documentation](https://polkadot.js.org/docs/substrate/storage).
Mainchain nodes currently use only a subset of these methods, in particular, the ones from the following pallets:

- *authorship*
- *babe*
- *balances*
- *grandpa*
- *imOnline*
- *offences*
- *session*
- *staking*
- *substrate*
- *sudo*
- *system*
- *timestamp*
- *transactionPayment*

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

### poe

#### [firstInsertionTime](#firstinsertiontime)

Returns the timestamp of the first insertion of a proof into the Merkle tree of the latest attestation.

**Returns**

`
Option<u64>
`

#### [nextAttestation](#nextattestation)

Returns the ID of the next attestation.

**Returns**

`
u64
`

#### [palletVersion](#palletversion)

Returns the software version of the pallet.

**Returns**

`
u16
`

#### [values](#values)

Queries the storage looking for the proofs included in the Merkle tree of an attestation.
The return value depends on the presence of the optional parameter `proof_hash`:

- If the parameter is not provided, the method returns the list of all the proofs included in the Merkle tree of the requested attestation (if any)
- If the parameter is provided, the method returns `null` if the proof is found in the attestation, `None` otherwise

**Parameters**

`attestation_id: u64`

`proof_hash: Option<H256>`

**Returns**

`
Option<null>
`

## [Extrinsics](#extrinsics)

Mainchain nodes support some of the most common extrinsics provided by Substrate (see the [official documentation](https://polkadot.js.org/docs/substrate/extrinsics)).
The pallet currently included in the runtime are:

- *balances*
- *grandpa*
- *imOnline*
- *session*
- *staking*
- *sudo*
- *system*
- *timestamp*

In addition to them, the following custom extrinsics are available:

### aggregate

#### [aggregate](#aggregate_3)

Publish the aggregation. This call is used to publish a new aggregation that is in
the domain both in to be published queue or is still not completed. If everything is fine,
move the held funds for this publication to the caller account.

In case everything is fine a [`Event::NewAggregationReceipt`](#newaggregationreceipt) is emitted.

If the aggregation coordinates are not valid and don't indicate an existing aggregation,
the call will fail, but the weight cost charged to the caller is just the one needed to do the checks.

Arguments:

- `domainId`: The domain's identifier.
- `id`: The aggregation's identifier.

#### [registerDomain](#registerdomain)

Register a new domain. It holds a deposit to cover the cost of all the storage that the domain needs.
The account that requested this domain will be the owner and is the only one that can unregister it.
[Unregister the domain](#unregisterdomain) will free the held funds and remove the domain from the system.

If everything is fine a [`Event::NewDomain`](#newdomain) is emitted.

Arguments:

- `aggregation_size`: The size of the aggregation, in other words how many statements any aggregation has.
- `queue_size`: The maximum number of aggregations that can be in the queue for this domain.

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

### poe

#### [publishAttestation](#publishattestation)

Creates an extrinsic to trigger the finalization of an attestation containing the proofs submitted in the current window.
If no proof is currently available, the attestation is empty but still published.

### Verifier Pallets

All verifier pallets share the following interface and define its types for: verification key, proof and public inputs. Anyway the
available exstrinsics are:

#### [submitProof](#submitproof)

Submit a `Proof` and verify it against the verification key `Vk` and public inputs `Pubs`. If the proof is valid it'll be included
in the next attestation. The extrinsic fails in the case of an invalid proof.

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
- [settlementFFlonkPallet](#settlementfflonkpallet-types)
- [settlementZksyncPallet](#settlementzksyncpallet-types)
- [settlementUltraplonkPallet](#settlementultraplonkpallet-types)
- [settlementPlonky2Pallet](#settlementproofofsqlpallet-types)
- [settlementPlonky2Pallet](#settlementplonky2pallet-types)

##### settlementGroth16Pallet Types

Support is provided for both the *BN254* curve used in Ethereum, and the *BLS12-381* curve. The details about how `G1`/`G2` elliptic
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

##### settlementFFlonkPallet Types

```rust
pub type Proof = [u8; 768];
pub struct Vk {
    power: u8,
    k1: Fr,
    k2: Fr,
    w: Fr,
    w3: Fr,
    w4: Fr,
    w8: Fr,
    wr: Fr,
    x2: G2,
    c0: G1, 
};
pub type Pubs = [u8; 32];
```

##### settlementzksyncPallet Types

```rust
pub type Proof = [u8; 1408];
pub type Vk = (); // zksync verifier doesn't have any verification key
pub type Pubs = [u8; 32];
```

#### settlementUltraplonkPallet Types

```rust
pub type Proof = Vec<u8>;
pub type Vk = [u8; 1719];
pub type Pubs = [u8; 32];
```

#### settlementProofOfSQLPallet Types

```rust
pub type Proof = Vec<u8>;
pub struct Vk<T>(Vec<u8>, PhantomData<T>);
pub type Pubs = Vec<u8>;
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

### poe

#### [NewElement](#newelement)

Emitted when a new ZK proof is submitted, successfully verified, and included in the Merkle tree for the currently pending attestation.

##### Fields

- `value: H256` The hash of the proof that has been included in the Merkle tree (i.e. the value of the leaf of the tree)
- `attestationId: u64` The ID of the attestation in which the proof has been included

#### [NewAttestation](#newattestation)

Emitted when a new attestation is finalized and published. It may contain 0 or more proofs.

##### Fields

- `id: u64` The ID of the attestation that has been finalized
- `attestation: H256` The root of the Merkle tree of the attestation

### Verifier Pallets

#### [VkRegistered](#vkregistered)

##### Fields

- `hash: H256` The hash of the registered verification key that can be used later in the `submitProof`
exstrinsic calls of the same verifier pallet

#### [ProofVerified](#proofverified)

##### Fields

- `statement: H256` The [statement](../03-proof_submission_interface/02-proof_submitter_flow.md#proof-submitter-flow)
  hash of the verified proof

## [Errors](#errors)

The Mainchain nodes throw the standard errors provided by Substrate (see the [official documentation](https://polkadot.js.org/docs/substrate/errors)).

In addition to them, the following custom errors have been defined:

### aggregate

#### [UnknownDomainId](#unknowndomainid)

It doesn't exist any domain with this identifier.

#### [InvalidAggregationId](#invalidaggregationid)

The provided aggregation coordinate doesn't refer to any available aggregation.

#### [InvalidDomainParams](#invaliddomainparams)

The given domain parameters are invalid.

#### [InvalidDomainState](#invaliddomainstate)

Try to remove or put on hold a domain from an invalid state.

### poe

#### [TooEarlyForASmallTree](#tooearlyforasmalltree)

Error thrown when a validator submits a block containing an attestation with too few proofs in the Merkle tree (the minimum and maximum number are configured in the runtime).

Note: the "sudo" account can override this behavior and submit an attestation whose size is lower than the minimum threshold.

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
