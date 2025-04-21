---
title: Verifying proofs with zkVerifyJS
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

In this tutorial we will be verifying proofs using zkVerify JS package. ```zkVerify JS``` is a NPM package which makes it very easy to submit proofs, listen events and get aggregation proofs. You can use this package with all the proof types we support.

Let's create a new project and install ```zkverify JS``` for our project. Run the following commands:
```bash
# Creating a new directory
mkdir proof-submission

# Navigating to the project directory
cd proof-submission

# Initializing an NPM project
npm init

# Installing zkVerify JS
npm i zkverifyjs
```

Create a new file named ```index.js``` to write the verification logic. Open ```index.js``` in your IDE and import the following components from ```zkVerify JS``` :

<Tabs groupId="import">
<TabItem value="circom" label="Circom">
```js
const {zkVerifySession, Library, CurveType, ZkVerifyEvents} = require("zkverifyjs");
```
</TabItem>
<TabItem value="r0" label="Risc Zero">
```js
const {zkVerifySession, ZkVerifyEvents} = require("zkverifyjs");
```
</TabItem>
<TabItem value="noir" label="Noir">
```js
const {zkVerifySession, ZkVerifyEvents} = require("zkverifyjs");
```
</TabItem>
</Tabs>

We would also need to import the required files we have generated already in previous tutorials, which are proof, verification key and public inputs. Use the following code snippets :

<Tabs groupId="import-files">
<TabItem value="circom" label="Circom">
```js
const fs = require("fs");
const proof = require("./data/proof.json");
const public = require("./data/public.json");
const key = require("./data/main.groth16.vkey.json");
```
</TabItem>
<TabItem value="r0" label="Risc Zero">
```js
const fs = require("fs");
const proof = require("../my_project/proof.json"); // Following the Risc Zero tutorial
```
</TabItem>
<TabItem value="noir" label="Noir">
```js
const fs = require("fs");
const proof = fs.readFileSync("../hello_world/proof.hex").toString()
const public = fs.readFileSync("../hello_world/pub.hex").toString()
```
</TabItem>
</Tabs>

Once you have all the requirements imported, we will start by instantiating a session with our Volta testnet with an account(This account should have $tVFY to pay for transactions). 
```js
const session = await zkVerifySession.start().Volta().withAccount("seed-phrase")
```

For Circom and Noir proofs, we need to register a verification key on our Volta testnet which will be used in further steps while verifying proofs. This step is not required for Risc Zero because we already got a hash of the image id which can be used directly. You can execute the following code snippet to register a vkey:

<Tabs groupId="register-vkey">
<TabItem value="circom" label="Circom">
```js
const {events, regResult} = await session.registerVerificationKey().groth16({library: Library.snarkjs, curve: CurveType.bn128}).execute(key);

events.on(ZkVerifyEvents.Finalized, (eventData) => {
    console.log('Registration finalized:', eventData);
    fs.writeFileSync("vkey.json", JSON.stringify({"hash": eventData.statementHash}, null, 2));
    return eventData.statementHash
});
```

Once registered you can find a new file called ``vkey.json`` with your registered verification key in the following format
```json
{
  "vkey": "0x828c736b33ab492251a8b275468a29ce06e98fc833c0c7f0bc7f6272b300c05b"
}
```

</TabItem>
<TabItem value="noir" label="Noir">
```js
let vk = fs.readFileSync("../hello_world/vk.hex").toString()

const {events, regResult} = await session.registerVerificationKey().ultraplonk().execute(vk.split("\n")[0]);

events.on(ZkVerifyEvents.Finalized, (eventData) => {
    console.log('Verification finalized:', eventData);
    fs.writeFileSync("vkey.json", JSON.stringify({"hash": eventData.statementHash}, null, 2));
    return eventData.statementHash
});

```
Once registered you can find a new file called ``vkey.json`` with your registered verification key in the following format
```json
{
  "vkey": "0x828c736b33ab492251a8b275468a29ce06e98fc833c0c7f0bc7f6272b300c05b"
}
```
</TabItem>
</Tabs>

Next we will send a proof verification request to the Volta testnet, with all the details like which proving schema, proof, public signals and the key. We will also need to specify the ``domainId`` for which we want this proof to be aggregated. You can check more about Domain and Aggregation [here](../../overview/04-proof-aggregation/01-overview.md). For this tutorial, choose the Domain ID based on the target chain where you want to verify the attestations [List of existing domains](../../overview/04-proof-aggregation/05-domain-management.md). We will also create an event listener, to listen to the ``NewAggregationReceipt`` event whenever our proof is aggregated :- 

<Tabs groupId="proof-verification">
<TabItem value="circom" label="Circom">
```js
session.subscribe([
    {event: ZkVerifyEvents.NewAggregationReceipt, callback: async(eventData: any) => {
        console.log('New aggregation receipt:', eventData);
        let statementpath = await session.getAggregateStatementPath(eventData.blockHash, parseInt(eventData.data.domainId), parseInt(eventData.data.aggregationId), statement);
        console.log('Statement path:', statementpath);
        const statementproof = {
            ...statementpath,
            domainId: parseInt(eventData.data.domainId),
            aggregationId: parseInt(eventData.data.aggregationId),
        };
        fs.writeFile("aggregation.json", JSON.stringify(statementproof));
    }, options:{domainId:0}}
])

const {events} = await session.verify()
.groth16({library: Library.snarkjs, curve: CurveType.bn128}).withRegisteredVk()
.execute({proofData: {
    vk: vkey.hash,
    proof: proof,
    publicSignals: public
}, domainId: 0});
```
</TabItem>
<TabItem value="r0" label="Risc Zero">
```js
session.subscribe([
    {event: ZkVerifyEvents.NewAggregationReceipt, callback: async(eventData: any) => {
        console.log('New aggregation receipt:', eventData);
        let statementpath = await session.getAggregateStatementPath(eventData.blockHash, parseInt(eventData.data.domainId), parseInt(eventData.data.aggregationId), statement);
        console.log('Statement path:', statementpath);
        const statementproof = {
            ...statementpath,
            domainId: parseInt(eventData.data.domainId),
            aggregationId: parseInt(eventData.data.aggregationId),
        };
        fs.writeFile("aggregation.json", JSON.stringify(statementproof));
    }, options:{domainId:0}}
])

const {events} = await session.verify().risc0()
.execute({proofData:{
    proof: proof.proof,
    vk: proof.image_id,
    publicSignals: proof.pub_inputs,
    version: "V1_2" // Mention the R0 version used while proving
}, domainId: 0})
```
</TabItem>
<TabItem value="noir" label="Noir">
```js
const vkey = require("./vkey.json")
session.subscribe([
    {event: ZkVerifyEvents.NewAggregationReceipt, callback: async(eventData: any) => {
        console.log('New aggregation receipt:', eventData);
        let statementpath = await session.getAggregateStatementPath(eventData.blockHash, parseInt(eventData.data.domainId), parseInt(eventData.data.aggregationId), statement);
        console.log('Statement path:', statementpath);
        const statementproof = {
            ...statementpath,
            domainId: parseInt(eventData.data.domainId),
            aggregationId: parseInt(eventData.data.aggregationId),
        };
        fs.writeFile("aggregation.json", JSON.stringify(statementproof));
    }, options:{domainId:0}}
])

const {events} = await session.verify().ultraplonk().withRegisteredVk().execute({proofData:{
    proof: proof.split("\n")[0],
    vk: vkey.hash,
    publicSignals: public.split("\n").slice(0,-1),
}, domainId: 0})
```
</TabItem>
</Tabs>

We can listen to events to get the current status of our submitted proof, and collect important data required for attestation verification. We have custom events for block inclusion, transaction finalization, etc. You can listen to them using our events.on() function like :- 
```js
events.on(ZkVerifyEvents.IncludedInBlock, (eventData) => {
    console.log("Included in block", eventData);
    statement = eventData.statement
})
```

Now, a new file named ``aggregation.json`` would have been created, which has the all the details required to verify the aggregation on the target chain. You would find something like the following:-
```json
{
  "root": "0xef4752160e8d7ccbc254a87f71256990f2fcd8173e15a592f7ccc7e130aa5ab0",
  "proof": [
    "0x40fbf21f1990ef8d1425d12ec550176fe848a7c63f0c59f7a48101e51c9aceee",
    "0x0be311c3643fb3fcd2b59bf4cfd02bdef943caf78f92d94a080659468c38fef9",
    "0x2117831ac2000ccdbb51f5deef96d215961ca42920a9196259e8b6e91b9fef53"
  ],
  "numberOfLeaves": 8,
  "leafIndex": 0,
  "leaf": "0xc5a8389b231522aad8360d940eb3ce275f0446bba1a9bd188b31d1c7dd37f136",
  "domainId": 0,
  "aggregationId": 137
}

```

You can check details about the verified proofs using our [zkVerify explorer](https://zkverify-testnet.subscan.io/).

<Tabs groupId="explorer">
<TabItem value="circom" label="Circom">
![alt_text](./img/circom-explorer.png)
</TabItem>
<TabItem value="r0" label="Risc Zero">
![alt_text](./img/r0-explorer.png)
</TabItem>
<TabItem value="noir" label="Noir">
![alt_text](./img/noir-explorer.png)
</TabItem>
</Tabs>

By running the above code snippet, your attestation proof will be saved at attestation.json file. After completing this process, we have successfully verified our proof with zkVerify and the next steps will be to use this attestation proof for our business logic onchain. Next we will be verifying the proof reciepts through a smart contract. You can check this [tutorial](./05-smart-contract.md) to understand more about the smart contract verification part.

