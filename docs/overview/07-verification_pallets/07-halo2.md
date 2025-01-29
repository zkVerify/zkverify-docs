---
title: Halo2 Verifier
---

## [`settlementHalo2Pallet`](https://github.com/HorizenLabs/zkVerify/tree/main/verifiers/halo2)

### Statement hash components

- context: `keccak256(b"halo2")`
- vk: `keccak256(vk.encode())`
- pubs: `keccak256(pubs)`

### `Verifier` implementation
Proof verification is performed by the `verifyProof` method, whose signature is
```rust
fn verify_proof(
    vk: &Self::Vk,
    proof: &Self::Proof,
    pubs: &Self::Pubs,
) -> Result<(), VerifyError>
```

`Self::Vk`, `Self::Proof`, are raw byte vectors, and are the result of the serialization of the following data structures:
- *Vk*: it contains concatenated:
  - [`ParamsKZG`](https://github.com/nulltea/halo2-verifier/blob/ff02e6b2788c2f782bafa472bac2b3b54ceb2516/halo2_verifier/src/poly/kzg/commitment.rs#L22) - fixed sized stripped-down version of the [Halo2's KZG](https://github.com/ChainSafe/halo2/blob/9ddf4c909c0a3aaa0ed0140a3c61a5f5396d5da7/halo2_proofs/src/poly/kzg/commitment.rs#L21) commitment parameters
    ```rust
    pub struct ParamsKZG<E: Engine> {
        pub k: u32,
        pub n: u64,
        pub g: E::G1Affine,
        pub g2: E::G2Affine,
        pub s_g2: E::G2Affine,
    }
    ```
  - [`VerifyingKey`](https://github.com/nulltea/halo2-verifier/blob/ff02e6b2788c2f782bafa472bac2b3b54ceb2516/halo2_verifier/src/plonk/vk.rs#L16) - the verifying key for a concrete circuit and KZG parameters. Unlike Halo2's [natively serialized](https://github.com/ChainSafe/halo2/blob/9ddf4c909c0a3aaa0ed0140a3c61a5f5396d5da7/halo2_proofs/src/plonk.rs#L79-L80) verifying key, this serialization also includes information about the concret circuit strucuture. For space-efficiensy it aslo represents gate/lookup expressions as multilinear polynomials instead of Rust's recursive enum types.
    ```rust
    pub struct VerifyingKey<C: CurveAffine> {
        pub domain: EvaluationDomain<C::Scalar>,
        pub fixed_commitments: Vec<C>,
        pub permutation: permutation::VerifyingKey<C>,
        pub cs: ConstraintSystem<C::Scalar>,
        pub cs_degree: usize,
        pub transcript_repr: C::Scalar,
        pub selectors: Vec<Vec<bool>>,
    }
    ```

- *Proof*: containts of a prover transcript.

- *Pubs*: is a vector of field elements `Vec<sp_core::U256>` for a single instance column of the PLONK circuit.

The `halo2-verifier` library offers method for correctly serializing these data structures, using the functions [`VerifyingKey::to_bytes()`](https://github.com/nulltea/halo2-verifier/blob/ff02e6b2788c2f782bafa472bac2b3b54ceb2516/halo2_verifier/src/plonk/vk.rs#L118), [`ParamzKZG::to_bytes()`](https://github.com/nulltea/halo2-verifier/blob/ff02e6b2788c2f782bafa472bac2b3b54ceb2516/halo2_verifier/src/poly/kzg/commitment.rs#L215). 

[`SerdeFormat`](https://github.com/nulltea/halo2-verifier/blob/ff02e6b2788c2f782bafa472bac2b3b54ceb2516/halo2_verifier/src/helpers.rs#L7) allows to choose one of 3 serialization formats:
- `Processed` - curve and field elements are serialized in compressed form, in little-endian order.
- RawBytes - curve elements are serialized in uncompressed form. Field elements are serialized in their internal Montgomery representation.
- RawBytesUnchecked - serialization is the same as `RawBytes`, but no checks are performed.

The `TryFrom<(ParamsKZG<bn256::Bn256>, VerifyingKey<bn256::G1Affine>)>` trait implementation to serialize the verifying key and KZG parameters into a concatenated [`ParamsAndVk<T: Config>`](https://github.com/nulltea/zkVerify/blob/0a672dbab4e85e60806a94b5474fe0cbae17892d/verifiers/halo2/src/lib.rs#L158-L159) bytes, which would also check that dimensions of the circuits is within the limits of `Config`.

The `Config` traits defines the maximum dimensions of the circuit, which are:

```rust
pub trait Config: 'static {
    type FixedMax: Get<u32>;
    type ColumnsMax: Get<u32>;
    type PermutationMax: Get<u32>;
    type SelectorMax: Get<u32>;
    type LargestK: Get<u32>;
    type QueriesMax: Get<u32>;
    type ExpressionDegreeMax: Get<u32>;
    type ExpressionVarsMax: Get<u32>;
    type GatesMax: Get<u32>;
    type LookupsMax: Get<u32>;
    type ShufflesMax: Get<u32>;
}
```

Specifying this is needed to compute `MaxEncodedLen` for the `ParamsAndVk` type. These values can be adjusted based on user application requirements.

### Setup

Before using the `verify_proof` method, the user needs to convert Halo2's `VerifyingKey` and `ParamsKZG` into their space-efficient `no-std` compatible versions. This can be done using methods in `serialize` crate.

To convert the `halo2_proofs::poly::kzg::ParamsKZG` into `ParamsKZG`, use [convert_params](https://github.com/nulltea/halo2-verifier/blob/ff02e6b2788c2f782bafa472bac2b3b54ceb2516/serialize/src/lib.rs#L26) method or CLI tool `convert-params`:

```bash
cargo run --bin convert-params ./params/kzg_bn254_8.srs
```

Binary source code of the `convert-params` tool is available [here](https://github.com/nulltea/halo2-verifier/blob/70d2471e9fc6df43c9a92a649a6c8037e03f6b3a/serialize/bin/convert_params.rs#L1-L2).

Since reading `halo2_proofs::plonk::VerifyingKey` requires knowledge of concrete circuit we cannot provide generic CLI. Instead, use [`convert_verifier_key`](https://github.com/nulltea/halo2-verifier/blob/ff02e6b2788c2f782bafa472bac2b3b54ceb2516/serialize/src/lib.rs#L12) method.

```rust
    let vk = halo2_proofs::plonk::VerifyingKey::<bn256::G1Affine>::read::<MyCircuit>(&mut reader, SerdeFormat::Processed)?;
    let vk = serialize::convert_verifier_key(vk);

    let mut file = File::create(out_path)?;
    file.write_all(&vk.to_bytes(SerdeFormat::Processed))?;
```

See the E2E example of how to convert the `VerifyingKey` and `ParamsKZG` into `ParamsAndVk` and use Halo2 verifier in the [`halo2-verifier`](https://github.com/nulltea/halo2-verifier/blob/7c63ed613c8904757f4fed71f38098ea8ead7aed/serialize/examples/shuffle_e2e_verify.rs#L1) crate.

### Result

The `halo2_verifier::verify_proof` method returns `Ok(Strategy::Output)` if verification is successful, otherwise it returns an error, indicating either unsuccessful proof verification or invalid input data.
