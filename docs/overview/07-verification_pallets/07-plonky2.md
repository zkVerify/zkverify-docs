---
title: Plonky2 Verifier
---

## [`settlementPlonky2Pallet`](https://github.com/HorizenLabs/zkVerify/tree/main/verifiers/plonky2)

### Statement hash components

- context: `keccak256(b"plonky2")`
- vk: `keccak256(vk.encode())`
- pubs: `keccak256(pubs)`

### `Verifier` implementation

Assume we have built `plonky2` circuit and proved it:

```rust
let data = builder.build::<C>();

let proof = data.prove(pw)?;
```

#### Verification Key

`Plonky2` needs `GateSerializer` trait to serialize `VerifierCircuitData`, for that please use `ZKVerifyGateSerializer`, since we will deserialize against it as well.

```rust
use plonky2_verifier::ZKVerifyGateSerializer;

let vk_bytes = data
    .verifier_data()
    .to_bytes(&ZKVerifyGateSerializer)?;
```

#### Proof

```rust
let mut proof_bytes = Vec::new();
proof_bytes.write_proof(&proof.proof)?;
```

#### Public Inputs

`Plonky2` keeps `Proof` with `Pubs` in one struct, while `zkVerify` requires these to be split.

```rust
let mut pubs_bytes = Vec::new();
pubs_bytes.write_usize(proof.public_inputs.len())?;
pubs_bytes.write_field_vec(proof.public_inputs.as_slice())?;
```

#### Config

`Plonky2` has generic-based configuration for it's plonk: [config.rs](https://github.com/0xPolygonZero/plonky2/blob/main/plonky2/src/plonk/config.rs). Things like hashing algorithm, field, etc. Due to limited support for passing them in `zkVerify`, we support only two preset configs over `Keccak` with `Goldilocks` and  `Poseidon` with `Goldilocks`.

Therefore, we use custom format for representing `Vk` - particularly, JSON of this form:

```json
{
    "config": "Poseidon",
    "bytes": "392093829392..."
}
```

Here `bytes` is hex-encoded representation of `vk_bytes` we computed earlier, and `config` is merely either `Keccak` or `Poseidon`.

You can leverage our `CLI` tool in order to transform your `Vk` into the one acceptable by `zkVerify` format - please see [plonky2-converter](https://github.com/distributed-lab/plonky2-verifier/tree/main?tab=readme-ov-file#plonky2-converter).

### Result

The `submitProof` exstrinsic can fail both if it's not possible to deserialize the proof (`InvalidProofData`) or if the proof doesn't
verify (`VerifyError`).
