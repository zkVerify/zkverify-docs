---
title: Overview
---

## Runtime Inclusion

Now that you have "palletized" your library, you have a package compatible with Substrate nodes that can be potentially integrated in any Substrate-based chain. In order to actually make it available in zkVerify, you need to include it in zkVerify's runtime.

Keep in mind you are generating a new runtime whose deployment on the live chain (wheter it being testnet or mainnet) depends on the submission of a specific extrinsic, namely `system.setCode`.  Hence until that chain upgrade occurs, users will be able to use your verifier just for development and testing purposes on a local chain, not on any live chain.
