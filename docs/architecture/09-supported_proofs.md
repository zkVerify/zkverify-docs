# Supported Proofs

| Proof Type           | Supported Versions / Curves | Limits                                                                                                 |
| -------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------ |
| **EZKL**           | Reusable Verifier only (v0.1.0), Bn254 (Curve), BDFG21 (batch opening scheme), no accumulator                       | **Max number of Public Inputs:** 32                                                                                                                |
| **Fflonk**           | Bn128                       | **Public Inputs:** 1                                                                                                                |
| **Groth16**          | Bls12-381, Bn128            | **Public Inputs:** 64                                                                                  |
| **Noir UltraHonk**  | Noir v1.0.0-beta.6, v0.84.0 \<\= bb \< v0.86.* and 0.84.0 \<\= bb.js \< v0.86.*, both ZK and non-ZK variants, Keccak256 only                 | **Public Inputs:** 32                                                                                  |
| **Noir UltraPlonk**  | \>\= v0.31.0, bbup \<\= v0.76.4                  | **Public Inputs:** 32                                                                                  |
| **Risc0**            | v2.1, v2.2, v2.3     | **Max Public Inputs Size:** 2052 bytes (2048 bytes user input), **Format:** cbor                       |
| **Plonky2**          | Keccak256, Poseidon         | **Max number of Public Inputs:** 64, **Max Proof Size:** 256 KiB, **Max Verification Key Size:** 50 KB |
| **SP1**             | v5.x                        | **Max Public Inputs Size:** 2048 bytes                                                                 |
