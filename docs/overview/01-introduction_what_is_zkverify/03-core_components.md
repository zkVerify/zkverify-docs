# zkVerify Architecture

![alt_text](./img/zkVerify-workflow.jpg)

## Core Blockchain

Our chain is an L1 proof of stake blockchain built on the Substrate framework. This chain is specialized in zk proofs verification, with built-in verifier pallets, each for a different type of zk proofs. ACME is the token for our chain, and to verify proofs on our chain you will need ACME.

## Proof Submission Interface

This is the entry point for our blockchain, where users will be submitting transactions and making RPC calls. Similar to any other blockchain we have our SDK implementation called [zkVerifyJS](https://docs.zkverify.io/tutorials/submit-proofs/typescript-example) that you can use to interact with the chain. This library makes it very easy for developers to interact with the mainchain with simple code snippets to register a verification key, submit a zk proof, listen to events, get attestation details, etc.

## Aggregation and Proof Receipt Mechanism

After the proof verification requests are fulfilled by our chain and added to its block, it passes through the attestation mechanism to generate a proof receipt for the verified proof. These proof receipts are the Merkle root of all the verified proofs for the given batch. These proof receipts are published on a smart contract on Ethereum through relayers.

## OnChain Verification

User submits Merkle proof for their attestation to the contract where the attestations were published. These Merkle proofs are then verified to check if the given proof was actually verified through zkVerify. Currently, our contracts are deployed on the following chains:

- Sepolia Testnet
- Arbitrum Sepolia Testnet
- Curtis (ApeChain Testnet)
- Gobi (EON Testnet)

## Verifier Pallets

We have created built-in verifier pallets for different proving schemes to support a wide variety of zk proofs on our chain. The proof submission interface passes the proof verification requests to respective verifier pallets which verify these proofs and add them to the block. Currently, we support :
- Fflonk (Circom, SnarkJS)
- Groth16 (Circom, SnarkJS, Gnark)
- Ultraplonk (Noir)
- Risc Zero
- SxT Proof of SQL
