# Supported Proofs

| Proof Type           | Supported Versions / Curves | Limits                                                                                                 |
| -------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------ |
| **EZKL**           | Reusable Verifier only (v0.1.0), BN254 (Curve), BDFG21 (batch opening scheme), no accumulator                       | **Max number of Public Inputs:** 32                                                                                                                |
| **Fflonk**           | BN128                       | **Max number of Public Inputs:** 1                                                                                                                |
| **Groth16**          | BLS12-381, BN128, BN254            | **Max number of Public Inputs:** 64                                                                                  |
| **Noir UltraHonk**  | Noir ≥ v1.0.0-beta.14, bb ≥ v3.0.0 and bb.js ≥ v3.0.0, both ZK and non-ZK variants, Keccak256 only                 | **Max number of Public Inputs:** 32, **Max Evaluation Domain Size:** $2^{25}$                                                                                |
| **Noir UltraPlonk**  | Noir ≥ v0.31.0, bb ≤ v0.76.4                  | **Max number of Public Inputs:** 32                                                                                  |
| **Risc0**            | v2.1, v2.2, v2.3     | **Max Public Inputs Size:** 2052 bytes (2048 bytes user input), **Format:** cbor                       |
| **Plonky2**          | Keccak256, Poseidon         | **Max number of Public Inputs:** 64, **Max Proof Size:** 256 KiB, **Max Verification Key Size:** 50 KB |
| **SP1**             | v5.x                        | **Max Public Inputs Size:** 2048 bytes                                                                 |
