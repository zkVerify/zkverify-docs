---
title: Getting Started
---

## Prerequisites

This tutorial assumes only a single prerequisite is satisfied: you have a library crate for your verifier, published on [GitHub](https://github.com/) or [crates.io](https://crates.io/).

The following list consists of the typical elements a verifier has to handle:

- Verification key: `vk` - can be a fixed size array, a slice, a vec or a struct
- Raw proof: `proof` - can be a fixed size array, a slice, a vec or a struct
- Public inputs: `pubs` - can be a fixed size array, a slice, a vec or a struct
- Verification function - a stateless routine requiring as parameters a triplet vk-proof-pubs; which allows it to determine if the proof is consistent with the verification key and if it's valid against the provided public inputs.

Finally, you need to know if your library crate can be built with the support of the standard library (`no_std`) or not. In the first case it is WASM compatible and this means its inclusion in zkVerify can be achieved through a forkless-upgrade.  Conversely it is tied to the node implementation (NATIVE mode) and it can be included only as a fork. It is important to understand which your case is because later in the tutorial you'll need to follow different instructions accordingly.

:::note
Due to the easier upgrade on the live chain, it is highly recommended to go for the WASM path whenever possible. If your library needs the support of the standard library consider refactoring it as much as you can, so as to drop that requirement. Follow the NATIVE path only if there is no possibility to avoid it.
:::

## Integrating the Library

In Substrate, all the business logic of the chain resides in a library called [runtime](https://docs.substrate.io/learn/architecture/#runtime). The building blocks of the runtime are in turn other smaller libraries called [pallets](https://docs.substrate.io/tutorials/build-application-logic/add-a-pallet/).

The integration of your verifier library can be split in three main parts:

- The "palletization" of the library, facilitated by pre-defined templates.  This part allows your library to be wrapped by a layer of functions specifically written so that it can be used in the runtime of a Substrate chain.
- The inclusion of the pallet into the runtime, so that it is actually available on the zkVerify chain.
- The adaptation of the end-to-end tests.

Before proceeding, make sure you have the [zkVerify](https://github.com/HorizenLabs/zkVerify) repository available on your machine.

Two dedicated branches are available for reference: one for the [WASM](https://github.com/HorizenLabs/zkVerify/tree/docs/new_verifier_tutorial_wasm) implementation and one for the [NATIVE](https://github.com/HorizenLabs/zkVerify/tree/docs/new_verifier_tutorial_native) implementation. Other useful resources for reference and comparison are the already available verifier pallets.
