---
title: Consensus
---

# zkVerify Mainchain Consensus

In zkVerify we use a delegated proof-of-stake consensus with deterministic finality, leveraging BABE for block authoring, and GRANDPA for block finalization.
The top stakers on zkVerify are selected as authorities contributing to both block authoring and finalization.

## Block Authoring
We use [BABE](https://docs.substrate.io/reference/glossary/#blind-assignment-of-blockchain-extension-babe) (Blind Assignment for Blockchain Extension) as the block authoring algorithm. BABE provides slot-based block authoring with a known set of validators which produce at least one block per slot. Slot assignment is based on the evaluation of a Verifiable Random Function (VRF). Each validator is assigned a weight for an epoch. This epoch is broken up into slots and the validator evaluates its VRF at each slot. For each slot that the validator's VRF output is below its relative weight, it is allowed to author a block as a primary author. We also leverage secondary slots so that every slot will have at least one block produced resulting in a constant block time.

## Block Finalization
[GRANDPA](https://paritytech.github.io/polkadot-sdk/master/sc_consensus_grandpa/index.html) (GHOST-based Recursive ANcestor Deriving Prefix Agreement) is a block finalization algorithm designed to work alongside block production mechanisms such as BABE.

On a high level, the GRANDPA algorithm follows these steps:

 - **Block Production:** Blocks are produced by a separate mechanism (e.g., BABE) and are broadcast to the network. These blocks are considered tentative until finalized by GRANDPA.


- **Voting on Blocks:** Validators participate in rounds of voting to decide on the block that should be finalized. Each validator casts a vote for a block that it believes can be finalized, which implicitly includes votes for all ancestors of that block on the blockchain.


- **GHOST Rule:** GRANDPA uses a variation of the Greedy Heaviest Observed Sub-Tree (GHOST) rule to select the block that has the majority of votes from validators. The GHOST rule helps in selecting the block that is on the heaviest (most weighted) chain, which indicates the chain with the most cumulative support from validators. In this case, the support/weight is the validator’s staked amount.


- **Two-Phase Voting:** GRANDPA's voting process consists of two phases - the "prevote" and "precommit":

    * **Prevote:** Validators vote for the block they consider should be finalized. This vote is based on the blocks they've seen and their current view of the chain.

    * **Precommit:** Validators precommit to a block if it is the descendant of the highest block they've seen justified in the prevote phase. A block is justified when more than 2/3 of the validators have prevoted for it, either directly or for a descendant of it.


- Finalization: Once more than 2/3 of validators have precommitted to a block (directly or for an ancestor of it), that block is considered finalized. This means that the block and all its ancestors are agreed upon to never be reverted.

## Parameters
We use the following configuration values to have a block time of 6 seconds, with epochs lasting 1 hour, and eras lasting 6 hours.

| Parameter | Value | Description |
| --- | --- | --- |
| Slot Duration | 6 seconds | Time period for which a block can be produced. Validators can only join or exit the validator set at a session change. |
| Epoch Duration | 600 slots (1h) | The number of slots in an epoch. An epoch is a period of time where the block producer set is fixed. |
| Era Duration | 6 epochs (6h) | The number of epochs in an era. At the end of any era, there is the election of the next validators and the payout of the rewards. |
