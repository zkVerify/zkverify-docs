---
title: What is VFlow ?
---

VFlow is the first zkVerify System Parachain specifically designed to act as a gateway, for zkVerify, to the EVM world.
The primary purpose of VFlow is to enable bridging back and forth, from zkVerify to any EVM Chain, the VFY Token, leveraging Layer Zero.

- VFlow is a *permissioned* EVM blockchain.
- VFlow was built starting from the [OpenZeppelin EVM Template](https://github.com/OpenZeppelin/polkadot-runtime-templates/tree/main/evm-template) and [Moonbeam](https://moonbeam.network/) [fork](https://github.com/moonbeam-foundation/frontier) of [Frontier](https://github.com/polkadot-evm/frontier).
Frontier provides an EVM compatibility layer for Substrate, with full support to all the Ethereum RPC APIs allowing to develop Dapps and interact with them leveraging the usual EVM developer tools (Metamask, Foundry, Hardhat, ReMix, etc).

## Parachain
Parachains are the primary means of scaling on Polkadot, and now zkVerify.
You can think of Parachains as Sidechains or Shards, which can have independent consensus, tokenomics, governance and features with respect to the Relay Chain, but the duty of validating and finalizing the produced blocks (called *para-blocks*) pertains to the Relay Chain validators (called *para-validators*).
A *para-block* won't be included in the Parachain until it is "approved" by the *para-validators*.
An independent set of *collators* is in charge of producing the blocks that are going to be proposed to the para-validators:
- A *collator selection* algorithm defines the set of collators that are authorized to produce para-blocks.
- A *block production* algorithm, instead, defines the rules according to which a collator, among the selected ones, is elected to produce a para-block for a given *slot*.

👉 Learn more about parachains [here](https://wiki.polkadot.network/docs/learn-parachains), and parathreads [here](https://wiki.polkadot.network/docs/learn-parathreads).

## Permissioned EVM

Only a specific set of addresses is allowed to deploy smart contracts on VFlow. Any other user action is, instead, allowed.
Future plans to fully open up the chain are under evaluation. Make sure to follow our channels for updates in this regard.

### Gas-nomics

- VFlow has a maximum limit of 22.5M gas per block.
- The gas price is updated according to the congestion of network (i.e. block fullness) and follows the same [rules](https://research.web3.foundation/Polkadot/overview/token-economics#2-slow-adjusting-mechanism) as the fee multiplier update in zkVerify.
- Some futher adjustments to the gas consumption were required in order to prevent excessive growth of the storage and Parachain blocks

### Substrate <> EVM Equivalence

Please note that VFlow is a fully-fledged EVM chain, but it is also a Substrate chain !

## Governance

VFlow doesn't currently have a decentralized form of governance or treasury. A *technical committee* is in charge of managing the chain and executing actions to modify the consensus (via *sudo* pallet).

## Tokenomics

VFlow is a System Parachain of zkVerify and shares the same native token (VFY). As such:

- VFlow won't have any initial allocaton and neither a fixed supply.
- VFlow cannot mint/burn tokens via inflation.
- Tokens circulating in VFlow are limited to those bridged from zkVerify via XCM.

## Consensus

- Currently, VFlow relies on a closed set of collators called *Invulnerables*. *Invulnerables* cannot be slashed or kicked, and can be added/removed only via governance. No other collator is allowed to join at the moment. 
- VFlow uses [AURA](https://openethereum.github.io/Aura) (*Authority Round*) for block authoring, which is simply a Proof-of-Authority round-robin selection of the collator that is allowed to produce a block for a given slot.
- Given that there is no inflation in VFlow, collators' rewards only come from transaction fees. More specifically:
    - All the fees are placed in a *pot*.
    The reward mechanism is such that every collator receives half the value of the *pot* when authoring a block.
    This system creates a *rolling average* effect on rewards, where the pot acts as a buffer and memory of past fee activity,
    with the objective to smoothen out rewards, by averaging out fee income over time:
        - If a block has exceptionally high fees, the author only gets half of the pot at that moment. The other half benefits future block authors.
        - If a block has very low fees, authors still get a reward based on the existing pot, which can sustain participation.
        - If the block fees are somewhat stable, the pot value will stabilize at around 2 times the average block fee,
          thus the collators' reward will stabilize at around the average block fee

### What to do next

- [Connect a wallet to VFlow and setup an account](./02-connect-a-wallet.md)
- [Teleport VFY from zkVerify to VFlow](./02-VFY-Bridging/01-token-teleport.md)
- [Relevant links](./05-vflow-hub.md)

