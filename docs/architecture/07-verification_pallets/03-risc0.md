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

- `verify_proof()` uses [`risc0-verifier` crate](https://github.com/HorizenLabs/risc0-verifier) to deserialize
  the proof and public inputs and then verify them against the given verification key.
- Define the following types:

  ```rust
  pub enum Proof {
      V2_1(Vec<u8>),
      V2_2(Vec<u8>),
      V2_3(Vec<u8>),
      V3_0(Vec<u8>),
  };
  pub type Pubs = Vec<u8>;
  pub type Vk = H256;
  ```

  The format for these components is:

  - `Proof`: The risc0's `InnerProof` serialized by `ciborium::into_writer` and wrapped in the version's `Proof` variant: if the risc0 proof is generated with the `2.x` version use the `Proof::V2_x` variant.
  - `Pubs` Public inputs: The risc0's `Journal::bytes`.
  - `Vk` Verification key: a bytes array of length 32; the conversion from a risc0 `image_id` (an integer array of length 8) must be big-endian.

- hash context data is `b"risc0"`
- the pubs bytes are the input ones
- `vk_hash()` just forward the given verification key and `vk_bytes()` should never be called: in this case we cannot know the verification key preimage.
- `verifier_version_hash` return the SHA256 hash of the follow string `"risc0:v<x>"` where `<x>` is that version:
  - `Proof::V2_1`: `sha256("risc0:v2.1")="0x545aa3fbe4f28bf5be6831341c3d5ba87b16f10089f8efbcc140060e06fb508b"`
  - `Proof::V2_2`: `sha256("risc0:v2.2")="0xb3321f8b04ee9a754860a415c691f00756990e2054e5023f1a68c260a7042efe"`
  - `Proof::V2_3`: `sha256("risc0:v2.3")="0x09c82225a1a8d085090e5169383d874fcca7a340517654659c4eb6fd105e79ec"`
  - `Proof::V3_0`: `sha256("risc0:v3.0")="0xaa24368f9ce9025f58596d966209fc3f322c8cac37dae753bb9b0367d273700d"`

#### Note

In this pallet it doesn't make sense to register any verification key, because the verification key hash function
`vk_hash()` is the identity.

### Result

The pallet uses [`risc0-verifier` crate](https://github.com/HorizenLabs/risc0-verifier) to verify them. The pallet's duties are summarized in the following code snippet:

```rust
assert!(risc0_verifier::verify(vk, &proof, &pubs).is_ok());
```

The `submitProof` exstrinsic can fail both if it's not possible to deserialize the proof or public inputs (`InvalidProofData`,
`InvalidInput`) or if the proof doesn't verify (`VerifyError`).
