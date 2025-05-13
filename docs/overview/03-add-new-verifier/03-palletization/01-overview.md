---
title: Overview
---

## Templates

The two main tools made available for integrating your library are:

- Library `hp-verifiers`: this library brings in a layer of abstraction and generalization, providing the primitives for verifier pallets. Inside the library you can find basic data structure templates (like `Arg`, for proofs and public inputs), the default errors list and the fundamental traits `Verifier` and `WeightInfo` defining the constraints your pallet has to satisfy for becoming a verifier pallet.
- Pallet `pallet-verifiers`: as stated in its description (`"Abstract verification pallets and provide the common extrinsics"`), is the template which all the currently available pallets are built on. It brings in key components like storage, events, transactions and many more, allowing your library to become a pallet, meaning it can be used within the runtime of a Substrate chain.

The subsequent sections have been written as high level guidelines and it is very likely you have to add, remove and adapt parts of the instructions and snippets provided.
