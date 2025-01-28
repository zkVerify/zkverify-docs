---
title: Groth16 Verifier
---

## [`settlementGroth16Pallet`](https://github.com/HorizenLabs/zkVerify/tree/main/verifiers/groth16)

### Statement hash components

- context: `keccak256(b"groth16")`
- vk: `keccak256(vk.encode())`
- pubs: `keccak256(pubs)` where pubs are the concatenated scalars bytes

The `submitProof` extrinsic can be used to verify Groth16 proofs.

### `Verifier` implementation

This verifier leverages the arkworks [`ark-groth16`](https://github.com/arkworks-rs/groth16/tree/v0.4.0) library for proof verification.
The notation and serialization of the fields which make up the proof and verification keys also closely mirror the ones of that library.
Therefore, if your proofs and verification keys are generated using `ark-groth16`, integrating with this pallet should be straightforward.
Instead, if your proofs and verification keys are generated using `snarkJS`, the [`snarkjs2zkv`](https://github.com/HorizenLabs/snarkjs2zkv) cli utility is available for performing the conversion.
If your proofs and verification keys are generated with other tools, the [encodings section](#encodings) describes in detail the encoding of the various arguments.

- `verify_proof()` deserialize the proof and public inputs and then verify them against the given verification key.
- Define the following types:

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

  pub struct Vk {
      pub curve: Curve,
      pub alpha_g1: G1,
      pub beta_g2: G2,
      pub gamma_g2: G2,
      pub delta_g2: G2,
      pub gamma_abc_g1: Vec<G1>,
  }
  pub struct Proof {
      pub curve: Curve,
      pub proof: ProofInner,
  }
  pub type Pubs = Vec<Scalar>;
  ```

- hash context data is `b"groth16"`
- `pubs_bytes()` are the concatenated scalars bytes
  
  ```rust
   pubs.iter()
      .flat_map(|s| s.0.iter().cloned())
      .collect::<Vec<_>>()
  ```

- `validate_vk` check the fields value and curve points

## [Encodings](#encodings)

The `Proof`, *verification key* `Vk`, and *public inputs* `Pubs` are composed of cryptographic primitives, namely *elliptic curve points* (belonging to either `G1` or `G2`) and `Scalars`.

- Elliptic curve points are represented in an uncompressed form, as the concatenation of the encoding of the `x` and `y` affine coordinates.
  
  - An element of the base field of the BN254 curve can be represented with 32 bytes, therefore the affine representation of a BN254 G1 point requires `2 * 32 = 64` bytes.
  Instead, since `G2` is an extension field of degree 2, the affine representation of a BN254 `G2` point requires double the space, namely `128` bytes.
  - An element of the base field of the BLS12-381 curve can be represented with `48` bytes.
  Therefore, the encoding of a BLS12-381 `G1` point requires `2 * 48 = 96` bytes,
  and the encoding of a BLS12-381 `G2` point requires `2 * 96 = 192` bytes.
  The `x` and `y` coordinates of the G1 and G2 points are encoded in little-endian
  format for BN254 curve, and in big-endian format for BLS12-381 curve.
  This is coherent with arkworks implementation.
- `Scalars` are little-endian encoded. The scalar field of both the BN254 and BLS12-381 curves can be represented with `32` bytes.

The following table summarizes the size of the encodings:

|          | BN254     | BLS12-381 |
| -------- | --------- | --------- |
| G1 point | 64 bytes  | 96 bytes  |
| G2 point | 128 bytes | 192 bytes |
| Scalar   | 32 bytes  | 32 bytes  |
