---
title: Abstract Verifier
---

## [`Abstract Verifier`](https://github.com/HorizenLabs/zkVerify/tree/main/pallets/verifiers)

The generic verifier abstraction that defines the extrinsic, events and errors for all verifiers. It also
implements the logic to generate the statements hash. Every verifier should implement the
`hp_verifiers::Verifier` trait:

- `Proof`: The proof data
- `Vk`: The verification key data
- `Pubs`: The public inputs data.
- `fn verify_proof()` the main verifier logic.
- `fn hash_context_data()` the unique context that identify the verifier (i.e. `b"fflonk"`)
- `fn pubs_bytes()` how to get the bytes from public inputs that will be hashed by `keccak256` in the final statement
- `fn validate_vk()` the extrinsic input type are encodable types and often is not possible to enforce type validity,
so you must provide how to check if the key is valid or not (default implementation accepts all verification key as valid).
- `fn vk_bytes()` how to get the bytes from verification key that will be hashed with `Self::vk_hash()` function (default
use scale encoded data).
- `fn vk_hash()` how to hash the verification key, this is useful to bypass the standard mechanism when the verification key is
already a hash: instead of taking the bytes and hash them you can just forward the vk as-is (default implementation use `keccak256` of
`Self::vk_bytes()`).

Beside the verifier logic and serialization/deserialization stuff, the `Verifier` developer should take care also of how the
statement digests will be computed. Given a valid proof, as mentioned in [Submitter Flow](../03-proof_submission_interface/02-proof_submitter_flow.md#proof-submitter-flow), ZkVerify generates a statement digest to identify uniquely the given proof
and maybe a smart contract should be able to compute this digest too on chain and so compute the public inputs bytes and hash.
This is way `Verifier` trait give the option to the developer to define his preferred encoding with `pubs_bytes()` to eventually
simplify the on-chain work. Also, for the verification key the developer can define how to encode it with the `vk_bytes()` but in
this case we can assume that a ZkRollup or ZkApp can set the value at deployment stage. Finally, there are some cases where the
verification key is already a hash (i.e. risc0 proofs) and here we provide to the developer the capability to not hash it
again via `vk_hash()`.

### How the statement digest is computed

Given a verifier implementation `V` the statement digest is computed as follows where `pubs` are the verified public inputs
and `vk` is the verification key:

```rust
let ctx = V::hash_context_data();
let vk_hash = V::vk_hash(&vk);
let pubs_bytes = V::pubs_bytes(&pubs);

let mut data_to_hash = keccak_256(ctx).to_vec();
data_to_hash.extend_from_slice(vk_hash.as_bytes());
data_to_hash.extend_from_slice(keccak_256(pubs_bytes).as_bytes_ref());
H256(keccak_256(data_to_hash.as_slice()))
```

### Submit Proof

The [`submitProof`](https://github.com/HorizenLabs/zkVerify/tree/main/pallets/verifiers/src/lib.rs#L213)
extrinsic get the verification key from the storage (if need it) and use `verify_proof()` implementation to check the proof.

### Register Verification Key

If you choose to use the hash of verification key instead of the key itself, you need to register it before via
[`registerVk`](https://github.com/HorizenLabs/zkVerify/tree/main/pallets/verifiers/src/lib.rs#L241). This
extrinsic saves the verification key in storage and emits a `VkRegistered(hash)` event with the hash that can be
used in `submitProof` call.
