---
title: EZKL Verifier
---

## [`settlementEzklPallet`](https://github.com/zkVerify/zkVerify/tree/main/verifiers/ezkl)

### Statement hash components

- context: `keccak256(b"ezkl")`
- vk: `keccak256(vk.encode())`
- pubs: `keccak256(pubs)`

### `Verifier` implementation

This pallet implements a verifier for EZKL (optimized Halo2) proofs generated with the [ezkl-verifier](https://github.com/zkonduit/ezkl-verifier/tree/main) library. This library is part of zkonduit's zkML library of cryptographic tools for verifiable AI, machine learning, and analytics. [EZKL](https://docs.ezkl.xyz/) receives a model in ONNX format (for example, a neural network) as input and it converts it to a ZKP-compatible circuit. The system is then able to generate a proof of correct model execution. Please note that currently:
1. only proofs generated using the *reusable* ezkl-verifier are supported;
2. accumulators are not supported.

- `verify_proof()` uses the [ezkl_verifier](https://github.com/zkVerify/ezkl_verifier/tree/v0.1.0) crate to verify proofs.
