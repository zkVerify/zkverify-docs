# Supported Proofs

| Proof Type           | Supported Versions / Curves | Limits                                                                                                 |
| -------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Fflonk**           | Bn128                       | **Public Inputs:** 1                                                                                                                |
| **Groth16**          | Bls12-381, Bn128            | **Public Inputs:** 64                                                                                  |
| **Noir UltraHonk**  | Noir v1.0.0-beta.6, ZK, Keccak256                 | **Public Inputs:** 32                                                                                  |
| **Noir UltraPlonk**  | >= v0.31.0, bbup \<\= v0.76.4                  | **Public Inputs:** 32                                                                                  |
| **Risc0**            | v2.1                 | **Max Public Inputs Size:** 2052 bytes (2048 bytes user input), **Format:** cbor                       |
| **Plonky2**          | Keccak256, Poseidon         | **Max number of Public Inputs:** 64, **Max Proof Size:** 256 KiB, **Max Verification Key Size:** 50 KB |
