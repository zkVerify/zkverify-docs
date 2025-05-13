---
title: Overview
---

![alt_text](../img/zkVerify-workflow.jpg)

# Foundational Framework
zkVerify embraces the “modular blockchain” paradigm, which emphasizes the design of decentralized systems with interchangeable components. In this context, we have carefully chosen Substrate as the foundation for our software development.

The sections below outline the reasons behind our decision, with a focus on how Substrate aligns with our modular approach.

## Modularity
Substrate is built with the goal of giving developers the possibility to quickly create new blockchains with their custom logic, guaranteeing maximum flexibility in terms of composability, configurability, and customization. This is ideal in the long term to keep high quality and maintainability.

## Upgradability
The framework comes with the support of WASM runtimes, meaning that the logic can easily be distributed and run by validators and network participants. This is a great advantage when dealing with node upgrades affecting consensus rules, as nodes can automatically distribute the new code on-chain and run it without requiring a download of a new client version and dealing with deprecations and hard forks.

## Robustness
Substrate is at the core of the Polkadot ecosystems and it’s successfully used by several other projects. It is very stable, continuously updated, and comes with several tools like explorers, wallets, utilities, libraries, etc.

## Performance
Despite being designed with modularity and compatibility in mind, Substrate is also very focused on efficiency and scalability. It adopts very smart technical solutions like erasure coding, blockchain state pruning, etc.
Additionally, it is written in Rust, a modern programming language that is the top choice for blockchain projects nowadays, providing both security and performance.

## Support
The community around Polkadot and other Substrate-based chains (both parachains and solo chains) is very big and active. The framework is currently used by more than [150 projects](https://substrate.io/ecosystem/). Its GitHub repository constantly receives hundreds of contributions every month.

## Consensus
Everything already said about modularity applies to consensus as well. Substrate has some built-in mechanisms, like PoW, Aura, BABE, and GRANDPA.  zkVerify uses BABE for block authoring to allow validators to produce new blocks based on their staking and the evaluation of a VRF function, while GRANDPA is used for block finalization.

The mix of these two mechanisms provides high availability, as blocks can always be produced with BABE, despite forks and chain reorganizations, and there is also a reduced time to deterministic finality when the supermajority of validators completes GRANDPA rounds.  Overall, this consensus has several similarities with Gasper (Ethereum) and Ouroboros Praos (Cardano).
