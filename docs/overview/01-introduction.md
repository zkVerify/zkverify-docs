---
slug: /
---
# What is zkVerify

zkVerify is a high-performance, public, and decentralized blockchain dedicated to zero-knowledge proof verification. It provides a modular and composable approach for ZK apps to verify proofs. 

## Goals of zkVerify

zkVerify focuses on verifying zero-knowledge proofs (zk-proofs). These proofs confirm that a computation was done correctly without revealing the data involved. They are useful for summarizing transactions, sharing selective identity information, secure voting, and hiding information in games (like secret cards).

A complete zero-knowledge proof has two key parts:

1. Proof Generation – creating the proof through computation.
2. Proof Verification – checking if the proof is valid.

Both steps are essential to confirm that the computation is correct. While many teams are improving how zk-proofs are generated to make them faster and smaller, every new proof system also needs a trustworthy way to verify these proofs.

zkVerify solves this by accepting proofs, verifying them, and recording both the proof and its verification on the blockchain for future reference.

## What is zkVerify trying to solve?

### Proof verification costs

From a macro cost perspective, the proof verification market is estimated to incur \$100+ million in security expenses alone for zkRollups in 2024, extending to \$1.5 billion by 2028 when including ZK applications.

On a more granular level, the verification of a single ZK proof on Ethereum can consume upwards of 200,000 to 300,000 gas units, depending on the proof type. Beyond nominal fees today, the variability of future fees inhibits product adoption. Offloading proof verification from L1s, such as Ethereum, serves to both drastically lower nominal costs, but also to stabilize costs over time in a way that segregates fees from gas volatility.

For instance, in times of network congestion, gas prices have reached over 100 Gwei, which means that verifying a single proof could cost between \$20 to \$60 or even more.

### Not all ZK proofs are verifiable on EVM

Verification of multiple proving backends, specifically STARK proofs, are very costly on Ethereum because of large proof size and other EVM constraints. Most of the zkVMs are currently based on STARK-proving backends, which recursively "wrap" their STARK proofs in a SNARK (groth16) proof to verify on Ethereum, adding a lot of latency to the proving time. With zkVerify, you can natively verify STARK proofs on our chain without the need to convert to groth16 proofs.

