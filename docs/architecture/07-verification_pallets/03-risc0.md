---
title: risc0 Verifier
---

## [`settlementRisc0Pallet`](https://github.com/zkVerify/zkVerify/tree/main/verifiers/risc0)

### Statement hash components

- context: `keccak256(b"risc0")`
- vk: `vk`
- pubs: `keccak256(pubs)`

### `Verifier` implementation

That's a zk-STARK proof verifier where the proof proves that some code has executed correctly and generates the associated computation output.
The code is attested through an image_id (named verification key in the verification process) and runs inside the risc0-zkVM that provides
the proof of execution through a receipt which contains the raw proof and the public inputs (journal in risc0 lingo) for the verification process.

- `verify_proof()` uses [`risc0-verifier` crate](https://github.com/HorizenLabs/risc0-verifier/tree/v0.1.0) to deserialize
the proof and public inputs and then verify them against the given verification key.
- Define the following types:

    ```rust
    pub enum Proof {
        V1_0(Vec<u8>),
        V1_1(Vec<u8>),
        V1_2(Vec<u8>),
    };
    pub type Pubs = Vec<u8>;
    pub type Vk = H256;
    ```

    The format for these components is:
      - `Proof`: The risc0's `InnerProof` serialized by `ciborium::into_writer` and wrapped in the version's `Proof` variant: if the risc0 proof is generated with the `1.x` version use the `Proof::V1_x` variant.
      - `Pubs` Public inputs: The risc0's `Journal::bytes`.
      - `Vk` Verification key: a bytes array of length 32; the conversion from a risc0 `image_id` (an integer array of length 8) must be big-endian.
- hash context data is `b"risc0"`
- the pubs bytes are the input ones
- `vk_hash()` just forward the given verification key and `vk_bytes()` should never be called: in this case we cannot know the verification key preimage.
- `verifier_version_hash` return the SHA256 hash of the follow string `"risc0:v<x>"` where `<x>` is that version:
  - `Proof::V1_0`: `sha256("risc0:v1.0")="0xdf801e3397d2a8fbb77c2fa30c7f7806ee8a60de44cb536108e7ef272618e2da"`
  - `Proof::V1_1`: `sha256("risc0:v1.1")="0x2a06d398245e645477a795d1b707344669459840d154e17fde4df2b40eea5558"`
  - `Proof::V1_2`: `sha256("risc0:v1.2")="0x5f39e7751602fc8dbc1055078b61e2704565e3271312744119505ab26605a942"`

#### Note

In this pallet it doesn't make sense to register any verification key, because the verification key hash function
`vk_hash()` is the identity.

### Result

The pallet uses [`risc0-verifier` crate](https://github.com/HorizenLabs/risc0-verifier/tree/v0.4.0) to verify them. The pallet's duties are summarized in the following code snippet:

```rust
assert!(risc0_verifier::verify(vk, &proof, &pubs).is_ok());
```

The `submitProof` exstrinsic can fail both if it's not possible to deserialize the proof or public inputs (`InvalidProofData`,
`InvalidInput`) or if the proof doesn't verify (`VerifyError`).
