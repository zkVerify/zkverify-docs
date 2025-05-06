# Supported Proofs

| Proof Type           | Supported Versions / Curves | Limits                                                                                                                              |
| -------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Fflonk**           | Bn128                       | **Public Inputs:** 1                                                                                                                |
| **Groth16**          | Bls12-381, Bn128            | **Public Inputs:** 16                                                                                                               |
| **Noir UltraPlonk**  | >= v0.31.0                  | **Public Inputs:** 32                                                                                                               |
| **Risc0**            | \<\= v2.0.x                 | **Max Public Inputs Size:** 2052 bytes (2048 bytes user input), **Format:** cbor                                                    |
| **SxT Proof of SQL** | v0.28.6                     | **Max SQL Table Rows:** 2^8                                                                                                         |
| **Plonky2**          | Keccak256, Poseidon         | **Uncompressed proofs ONLY** **Max number of Public Inputs:** 64, **Max Proof Size:** 256 KiB, **Max Verification Key Size:** 50 KB |
