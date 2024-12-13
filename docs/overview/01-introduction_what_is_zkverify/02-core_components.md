# Proof Verification Chain

![alt_text](./img/zkverifyarch.png)

zkVerify is made of five core components that are defined below.

## Mainchain

This is an L1 Proof of Stake blockchain implemented as a Substrate Solo Chain. Its main responsibilities, besides exchanging $ACME, the primary token of the chain, are to receive, verify, and store validity proofs.  It houses the verifier modules, such as the Fflonk native verifier.  In some other documents, this component may also be referred to as the Proof Verification Chain.

## Proof Submission Interface

This is the interface (i.e. transactions and RPC calls) used by clients (zk rollups and zkapps) to submit proofs to zkVerify for verification.

## Proof Aggregation Engine

The aggregation proofs system is designed to be permission less and everyone can participate in this step by publishing the aggregation and get some fee by doing this job. It's possible to define several aggregation domains and each domain has its own aggregation size: when a user needs to verify a proof can choose in which domain he would his proof should be aggregated.

## Attestation Mechanism

The protocol that publishes on-chain an attestation that a given set of proofs have been verified by the Mainchain. In particular, this is a Merkle root of a Merkle Tree of proofs, published onto the zkVerify smart contract once a given publication policy is met. Currently the contract is deployed on the following chains:

- Sepolia (Ethereum testnet).
- Curtis (ApeChain testnet).
- Gobi (EON testnet).

## zkVerify Smart Contract

The core responsibility of this smart contract (ZkVerify.sol) is to store new attestations, validate them, and provide capabilities for zkVerify users to verify that their proof is part of the attestation.

## Proof Submitters

Users interested in verifying proofs on zkVerify because:

- It is cheaper than doing it on a given settlement layer (e.g. Ethereum).
- For notarization/timestamping purposes.
