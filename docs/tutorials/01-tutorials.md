---
title: zkVerify Tutorials
---

## Overview

In this section, we aim to provide end-users with step-by-step guides to achieve their goals with zkVerify!

## How to get started

To get started:

1. Users should first [get a wallet](connect-a-wallet) and connect it to the network.
2. Then users should [request](get_testnet_tokens) some $ACME testnet tokens.
3. From there it's possible to proceed in a few different ways. Follow the specific tutorial for:
   - [Porting your dApp](porting-dapp) to zkVerify,
   - Deploying a zkRollup for [zkSync](run-a-zkrollup/zksync_installation) or for [Polygon CDK](run-a-zkrollup/polygon_cdk_installation).
   - Simply submitting proofs via [Tenderly](submit-proofs/polygon_cdk_proof_submission) or using the [TypeScript Example](submit-proofs/typescript-example).
   - [Running a node](how_to_run_a_node/getting_started) and participating in the zkVerify network.

**Troubleshooting**
--------------------------------

- I can’t find my transaction on your block explorer.

  - We recently changed the SS58Prefix for our chain.  

  - This means that your wallet address needs to be transformed.

  - Enter your address (which would start with 5xxx) into this site:

    - [https://ss58.org/](https://ss58.org/).

    - Turn on the “Custom Prefix” and set the value to 251.

  - Here’s an example:

    - **SS58 Address**: 5Ey6TCDTYLKu1BwUWdZPDpC8RPhkCwRLdUDah7Da1wyKWhSU

    - Turn on the “**Custom Prefix**” and set the value to 251.

    - Hit “Convert.”

    - The **output** is: xpi72tyvr2adaKPnMdsm5v4UcKZnimzJTQ6kPvgEabf2qcwFA
