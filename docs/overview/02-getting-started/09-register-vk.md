---
title: Registering Verification Key
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

In this tutorial, we will be exploring how you can register a verification key on zkVerify. By registering a verification key you can save a lot of transaction fees while sending proofs for verification. After you register a vkey, now you can use the vkHash instead for vkey while sending proofs for verification.

:::note
Registration of the vkey is required once per circuit. You can skip this part if you are just building for a hackathon project or POC.
:::

To follow this tutorial, make sure you have succesfully completed [this tutorial](./06-zkverify-js.md). We will be editing the files which you have already used in the previous tutorials.

First, create a new file named ``register.js`` in which we will write the logic to register our vkey on zkVerify. Open ```register.js``` in your IDE and import the following components from ```zkVerify JS``` and ``dotenv`` :

<Tabs groupId="import">
<TabItem value="circom" label="Circom">
```js
import { zkVerifySession, Library, CurveType, ZkVerifyEvents } from "zkverifyjs";
import dotenv from 'dotenv';
dotenv.config();
```
</TabItem>
<TabItem value="r0" label="Risc Zero">
```js
import { zkVerifySession, ZkVerifyEvents } from "zkverifyjs";
import dotenv from 'dotenv';
dotenv.config();
```
</TabItem>
<TabItem value="ultrahonk" label="Ultrahonk">
```js
import { zkVerifySession, ZkVerifyEvents } from "zkverifyjs";
import dotenv from 'dotenv';
dotenv.config();
```
</TabItem>
<TabItem value="ultraplonk" label="Ultraplonk">
```js
import { zkVerifySession, ZkVerifyEvents } from "zkverifyjs";
import dotenv from 'dotenv';
dotenv.config();
```
</TabItem>
<TabItem value="sp1" label="SP1">
```js
import { zkVerifySession, ZkVerifyEvents } from "zkverifyjs";
import dotenv from 'dotenv';
dotenv.config();
```
</TabItem>
</Tabs>

We would also need to import the required verification key which we have already generated in previous tutorials. Use the following code snippets :
<Tabs groupId="import-files">
<TabItem value="circom" label="Circom">
```js
import fs from "fs";
const key = JSON.parse(fs.readFileSync("./data/main.groth16.vkey.json"));
```
</TabItem>
<TabItem value="r0" label="Risc Zero">
```js
import fs from "fs";
const proof = JSON.parse(fs.readFileSync("../my_project/proof.json")); // Following the Risc Zero tutorial
```
</TabItem>
<TabItem value="ultrahonk" label="Ultrahonk">
```js
import fs from "fs";
const bufvk = fs.readFileSync("../target/vk");
const base64Vk = bufvk.toString("base64");
```
</TabItem>
<TabItem value="ultraplonk" label="Ultraplonk">
```js
import fs from "fs";
const bufvk = fs.readFileSync("../target/vk");
const base64Vk = bufvk.toString("base64");
```
</TabItem>
<TabItem value="sp1" label="SP1">
```js
import fs from "fs";
const proof = JSON.parse(fs.readFileSync("../my_project/proof.json")); // Following the SP1 tutorial
```
</TabItem>
</Tabs>

:::info
Next we will be writing the core logic to send proofs to zkVerify for verification.
All the following code snippets should be inserted within async main function.
```js
async function main(){
  // Required code
}

main();
```
:::

Once you have all the requirements imported, we will start by instantiating a session with our Volta testnet with an account(This account should have $tVFY to pay for transactions). 
```js
const session = await zkVerifySession.start().Volta().withAccount(process.env.SEED_PHRASE);
```

Next we will call the ``registerVerificationKey()`` function with the session we created previously. We will also listen to the ``Finalized`` events for our transaction and store the ``vkHash`` in ``vkey.json`` file.

<Tabs groupId="register-vkey">
<TabItem value="circom" label="Circom">
```js
const {regevent} = await session.registerVerificationKey().groth16({library: Library.snarkjs, curve: CurveType.bn128}).execute(key);

regevent.on(ZkVerifyEvents.Finalized, (eventData) => {
    console.log('Registration finalized:', eventData);
    fs.writeFileSync("vkey.json", JSON.stringify({"hash": eventData.statementHash}, null, 2));
    return eventData.statementHash
});
```
</TabItem>
<TabItem value="risc0" label="RiscZero">
```js
const {regevent} = await session.registerVerificationKey().risc0().execute(proof.image_id);

regevent.on(ZkVerifyEvents.Finalized, (eventData) => {
    console.log('Registration finalized:', eventData);
    fs.writeFileSync("vkey.json", JSON.stringify({"hash": eventData.statementHash}, null, 2));
    return eventData.statementHash
});
```
</TabItem>
<TabItem value="ultrahonk" label="Ultrahonk">
```js
const {regevent} = await session.registerVerificationKey().ultrahonk({numberOfPublicInputs:2}).execute(base64Vk); // Make sure to replace the numberOfPublicInputs field as per your circuit

regevent.on(ZkVerifyEvents.Finalized, (eventData) => {
    console.log('Registration finalized:', eventData);
    fs.writeFileSync("vkey.json", JSON.stringify({"hash": eventData.statementHash}, null, 2));
    return eventData.statementHash
});
```
</TabItem>
<TabItem value="ultraplonk" label="Ultraplonk">
```js
const {regevent} = await session.registerVerificationKey().ultraplonk({numberOfPublicInputs:2}).execute(base64Vk); // Make sure to replace the numberOfPublicInputs field as per your circuit

regevent.on(ZkVerifyEvents.Finalized, (eventData) => {
    console.log('Registration finalized:', eventData);
    fs.writeFileSync("vkey.json", JSON.stringify({"hash": eventData.statementHash}, null, 2));
    return eventData.statementHash
});
```
</TabItem>
<TabItem value="sp1" label="SP1">
```js
const {regevent} = await session.registerVerificationKey().sp1().execute(proof.image_id);

regevent.on(ZkVerifyEvents.Finalized, (eventData) => {
    console.log('Registration finalized:', eventData);
    fs.writeFileSync("vkey.json", JSON.stringify({"hash": eventData.statementHash}, null, 2));
    return eventData.statementHash
});
```
</TabItem>
</Tabs>

Now you can run this script using the command ``node register.js`` to start the registration process. Once registered you can find a new file called ``vkey.json`` with your registered verification key in the following format
```json
{
  "vkey": "0x828c736b33ab492251a8b275468a29ce06e98fc833c0c7f0bc7f6272b300c05b"
}
```

Next we will edit the existing ``index.js`` file to use the registered vkHash instead of directly using the vkey for verification. First we will import the ``vkey.json`` file and then use the ``withRegisteredVk()`` property while calling the ``verify()`` function. Also, we will pass the new registered vkHash to the ``verify()`` function.

Paste the following code snippet at the start of the ``main`` function.
```js
const vkey = JSON.parse(fs.readFileSync("./vkey.json")) //Importing the registered vkhash
```

Next replace the existing ``verify()`` function with the folllwing code snippets :
<Tabs groupId="register-vkey">
<TabItem value="circom" label="Circom">
```js
const {events} = await session.verify()
    .groth16({library: Library.snarkjs, curve: CurveType.bn128})
    .withRegisteredVk()
    .execute({proofData: {
        vk: vkey.hash,
        proof: proof,
        publicSignals: publicInputs
    }, domainId: 0});
```
</TabItem>
<TabItem value="risc0" label="RiscZero">
```js
const {events} = await session.verify().risc0()
    .withRegisteredVk()
    .execute({proofData:{
        proof: proof.proof,
        vk: vkey.hash,
        publicSignals: proof.pub_inputs,
        version: "V2_1" // Mention the R0 version used while proving
    }, domainId: 0})
```
</TabItem>
<TabItem value="ultrahonk" label="Ultrahonk">
```js
const {events} = await session.verify()
    .ultrahonk({numberOfPublicInputs: 2}) // Make sure to replace the numberOfPublicInputs field as per your circuit 
    .withRegisteredVk() 
    .execute({proofData: {
        vk: vkey.hash,
        proof: base64Proof,
    }, domainId: 0});
```
</TabItem>
<TabItem value="ultraplonk" label="Ultraplonk">
```js
const {events} = await session.verify()
    .ultraplonk({numberOfPublicInputs: 2}) // Make sure to replace the numberOfPublicInputs field as per your circuit 
    .withRegisteredVk() 
    .execute({proofData: {
        vk: vkey.hash,
        proof: base64Proof,
    }, domainId: 0});
```
</TabItem>
<TabItem value="sp1" label="SP1">
```js
const {events} = await session.verify().sp1()
    .withRegisteredVk()
    .execute({proofData:{
        proof: proof.proof,
        vk: vkey.hash,
        publicSignals: proof.pub_inputs,
    }, domainId: 0})
```
</TabItem>
</Tabs>

Now you can run this script using the command ``node index.js``. After running the script a new file named ``aggregation.json`` would have been created, which has the all the details required to verify the aggregation on the target chain. You would find something like the following:
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