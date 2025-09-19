---
title: Stwo Verifier
---

## [`settlementStwoPallet`](https://github.com/zkVerify/zkVerify/tree/main/verifiers/stwo)

### Statement hash components

- context: `keccak256(b"stwo")`
- vk: `keccak256(vk.encode())`
- pubs: `keccak256(pubs.encode())`

The `submitProof` extrinsic can be used to verify Stwo proofs.

### `Verifier` implementation

This verifier implements a comprehensive zero-knowledge proof verification system for Stwo proofs. The implementation provides both single proof verification and batch verification capabilities, making it suitable for high-throughput applications.

- `verify_proof()` performs cryptographic validation of the proof against the verification key and public inputs
- `verify_batch()` enables efficient verification of multiple proofs in a single transaction
- `verify_recursive()` supports recursive proof verification for complex proof compositions

The verifier defines the following types:

```rust
pub enum ProofType {
    Standard,
    Recursive,
}

pub struct StwoVerificationKey {
    pub bytes: Vec<u8>,
    pub is_recursive: bool,
}

pub struct StwoProof {
    pub bytes: Vec<u8>,
    pub proof_type: ProofType,
}

pub struct StwoPublicInputs {
    pub inputs: Vec<u8>,
}
```

### Verification Process

The verification process includes multiple validation layers:

1. **Format Validation**: Ensures all input data structures are properly formatted
2. **Checksum Validation**: Performs integrity checks on proof and input data
3. **Cryptographic Validation**: Validates the mathematical properties of the proof
4. **Recursive Validation**: For recursive proofs, validates inner proof structures

### Batch Verification

The verifier supports efficient batch processing:

- Multiple proofs can be verified in a single transaction
- Batch verification fails if any individual proof fails
- Optimized for high-throughput scenarios

### Integration

The Stwo verifier integrates seamlessly with the zkVerify ecosystem:

- Compatible with the standard zkVerify proof submission interface
- Supports both standard and recursive proof types
- Provides comprehensive error handling and event emission
- Includes extensive test coverage for various verification scenarios

### Usage Examples

```rust
// Single proof verification
let vk = StwoVerificationKey {
    bytes: verification_key_bytes,
    is_recursive: false,
};

let proof = StwoProof {
    bytes: proof_bytes,
    proof_type: ProofType::Standard,
};

let inputs = StwoPublicInputs {
    inputs: public_input_bytes,
};

let is_valid = AdvancedStwoVerifier::verify(&vk, &proof, &inputs);

// Batch verification
let proofs_and_inputs = vec![
    (proof1, inputs1),
    (proof2, inputs2),
    (proof3, inputs3),
];

let batch_valid = AdvancedStwoVerifier::verify_batch(&vk, &proofs_and_inputs);
```

### Error Handling

The verifier provides comprehensive error handling for various failure scenarios:

- Invalid proof format
- Corrupted verification keys
- Malformed public inputs
- Cryptographic validation failures
- Recursive proof validation errors

All verification results are properly logged and events are emitted for successful and failed verifications.
