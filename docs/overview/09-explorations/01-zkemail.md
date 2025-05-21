---
title: zkEmail
---

This guide will walk you through the process of verifying zkEmail proofs with zkVerify. We will be using the [zkEmail SDK](https://docs.zk.email/zk-email-sdk/setup) to generate remote proofs, and then we will be using [zkVerifyJS](../04-zkverifyjs.md) to verify the zkEmail proofs(Groth16).

To start with, we will create a new directory, initialize npm, and install required packages(@zk-email/sdk and zkVerifyJS). Use the following commands:- 
```bash
# This will create a new directory for our project
mkdir zkEmail-zkVerify

# Moving inside our directory
cd zkEmail-zkVerify

# Initializing our project
npm init

# Installing required packages
npm i @zk-email/sdk zkverifyjs
```

After installing all the required packages, we can create ``index.js`` file. We can start by importing all the required packages.

```js
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// CommonJS import
const { zkVerifySession, Library, CurveType, ZkVerifyEvents } = require("zkverifyjs");

import zkeSDK, { Proof } from "@zk-email/sdk";
import fs from "fs/promises";
```

Next steps would be to choose a blueprint from the [ZKEmail registry](https://registry.zk.email/) and generate ZK proofs for supported email. We can start by importing the blueprint using the zkeSDK(). While importing the blueprint let’s also get the verification key which will be later used during verification.

```js
// Initialize the SDK
const sdk = zkeSDK();
  
// Get blueprint from the registry
const blueprint = await sdk.getBlueprint("Bisht13/SuccinctZKResidencyInvite@v3");

// Download the vkey
const vkey = await blueprint.getVkey();
const prover = blueprint.createProver();
```

After this, we need to get a compatible email file to generate the ZK proof. For this example, we will use the example email provided by ZKEmail. You can download it from [here](https://docs.zk.email/files/residency.eml). We will use the ``generateProof`` function to generate the proof remotely on zkEmail’s server for fast proving.

```js
// Read email file
const eml = await fs.readFile("residency.EML", "utf-8");
  
// Generate the proof
const proof = await prover.generateProof(eml);
```

Now, we have successfully generated a Groth16 zkEmail proof. We will try to verify this proof using zkVerifyJS. Let’s create a ``session`` using our seed phrase.

```js
const session = await zkVerifySession.start().Volta().withAccount("seed-phrase");
```

After creating a session, we can directly call the ``verify`` function to verify the ``groth16`` proof. Also, we will listen to ``IncludedInBlock`` event for our transaction and log the transaction details.

```js
const {events} = await session.verify()
    .groth16({library: Library.snarkjs, curve: CurveType.bn128})
    .execute({proofData: {
        vk: JSON.parse(vkey),
        proof: proof.props.proofData,
        publicSignals: proof.props.publicOutputs
    }});

events.on(ZkVerifyEvents.IncludedInBlock, (eventData) => {
    console.log("Included in block", eventData);
})
```

You can check your verified proof on our [zkVerify Explorer](https://zkverify-testnet.subscan.io/) using the txHash logged.

![](./img/zkemail-explorer.png)

### Next Steps

You can check our more detailed [tutorials](../02-getting-started/05-zkverify-js.md) to aggregate proofs and verify the aggregations on other connected chains like Ethereum, Arbitrum etc.