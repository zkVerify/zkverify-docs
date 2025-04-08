---
title: State and Proof Storage
---

# zkVerify Mainchain State and Proof Storage

Proofs are stored directly on-chain. The block storage policy depends on the type of node being run.

## Validator nodes
Validator nodes are configured as archive nodes by default, and thus they store the full state of the blockchain, including every block produced from the genesis to the tip. This includes any proof included in blocks. Validator nodes can override this configuration and enable pruning so that they keep only the last N blocks, but this is considered unsafe for this type of node.

## Standard nodes
Standard nodes enable pruning by default, keeping only the last 256 blocks of the chain. This saves a lot of disk space. Standard nodes can change the default configuration and run as archive nodes in the same way validators do.
