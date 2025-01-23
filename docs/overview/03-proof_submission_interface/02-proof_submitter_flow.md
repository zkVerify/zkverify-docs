---
title: Proof Submitter Flow
---

## Proof Submitter flow

The flow will be the following:

1. A proof submitter (rollup / zkApp) submits the proof via the [`submitProof`](../02-mainchain/05-mainchain_api.md#submitproof) extrinsic of the appropriate verification pallet. The proof leaf `value` will be:

    ```rust
        leaf_digest = keccak256(keccak256(verifier_ctx), hash(vk), version_hash(proof), keccak256(public_inputs_bytes))
    ```

    In order to compute the `leaf_digest` with the previous formula, every verifier should define:
      - `verifier_ctx` (a unique byte sequence)
      - how to hash the verification key
      - how to get the hash version of the verifier to use if any
      - how to extract a byte sequence from public inputs

2. If the proof is valid, it is relayed by the consensus and eventually included in a Mainchain block; otherwise the transaction reverts with an error.
3. The failing transaction will be included in the block anyway, and the user will pay fees for it. This is to prevent DoS attacks.
4. When the block in which the proof was posted is finalized, a [`Poe::NewElement`](../02-mainchain/05-mainchain_api.md#newelement) event is emitted, containing the digest of the proof `value` and the id of the attestation in which the proof will be included `attestation_id`.
5. When a predefined policy is met, a Merkle tree for the `attestation_id` is generated and a [`Poe::NewAttestation`](../02-mainchain/05-mainchain_api.md#newattestation) event is emitted with `id` and `attestation` fields.
6. The Proof Submitter can retrieve the Merkle Path of the submitted proof via the [`poe_proofPath`](../02-mainchain/05-mainchain_api.md#poe_proofpath) extrinsic of the PoE pallet, supplying the `attestation_id` and a digest of the proof `proof_hash`

## Pallets

Some pallets have been developed to accommodate the requirements:

- **_Verifiers_** where each one defines the proof, verification key and public inputs types, implements the verification logic and defines how to compute the 3 hashes that compose the final statement hash that represent the proof leaf `value`:
  - [**fflonk**](../06-verification_pallets/01-fflonk.md)
  - [**zksync**](../06-verification_pallets/02-zksync_era.md)
  - [**risc0**](../06-verification_pallets/03-risc0.md)
  - [**groth16**](../06-verification_pallets/04-groth16.md)
- **proof_of_existence:** The attestation pallet that defines the logic to generate new attestations and the corresponding events once that the conditions of a given policy are met.
- **proof_of_existence_rpc:** Defines the interface and the logic of the `proofPath` RPC call.
