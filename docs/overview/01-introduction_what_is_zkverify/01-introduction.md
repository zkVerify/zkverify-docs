---
slug: /
---
# What is zkVerify

zkVerify is a high-performant, public, and decentralized blockchain dedicated to zero-knowledge proof verification. It provides a modular and composable approach for ZK apps to verify proofs. 

## Goals of zkVerify

zkVerify focuses on verifying zero-knowledge proofs (zk-proofs). These proofs confirm that a computation was done correctly without revealing the data involved. They are useful for summarizing transactions, sharing selective identity information, secure voting, and hiding information in games (like secret cards).

A complete zero-knowledge proof has two key parts:

1. Proof Generation – creating the proof through computation.
2. Proof Verification – checking if the proof is valid.

Both steps are essential to confirm that the computation is correct. While many teams are improving how zk-proofs are generated to make them faster and smaller, every new proof system also needs a trustworthy way to verify these proofs.

zkVerify solves this by accepting proofs, verifying them, and recording both the proof and its verification on the blockchain for future reference.

## What is zkVerify trying to solve ?

### Proof verification costs

Verification of a groth16 zero-knowledge proof on Ethereum takes around 200k - 300k gas units, which is not scalable if we really want to build real-world zk apps that would continuously submit proofs onto Ethereum. Through zkVerify, developers verify proofs on our chain directly (which is specialized to verify zk proofs) and get the corresponding proof receipts (proof verification result) on Ethereum. This approach leads to lower verification costs as well as more scalability.

### Not all ZK proofs are verifiable on EVM

Verification of multiple proving backends, specifically STARK proofs, are very costly on Ethereum because of large proof size and other EVM constraints. Most of the zkVMs are currently based on STARK-proving backends, which recursively "wrap" their STARK proofs in a SNARK (groth16) proof to verify on Ethereum, adding a lot of latency to the proving time. With zkVerify, you can natively verify STARK proofs on our chain without the need to convert to groth16 proofs.

