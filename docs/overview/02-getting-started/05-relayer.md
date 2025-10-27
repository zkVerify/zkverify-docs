---
title: Verifying proofs with Relayer
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

:::info
All the codebase used in the tutorial can be explored [here](https://github.com/zkVerify/tutorials/tree/main/relayer)
:::

In this tutorial, we will be exploring the process of verifying proofs on zkVerify using Relayer. Relayer is a REST API service built by [Horizen Labs](https://horizenlabs.io) which makes the process of verifying proofs on zkVerify very easy and straightforward.

:::note
Before starting the tutorial make sure to update your Node JS to the latest version (v24.1.0)
You can check your Node JS version with command ``node -v``
:::

Let's create a new project and install ```axios``` for our project. Run the following commands:

Create a new directory:
```bash
mkdir proof-submission
```
Navigate to the project directory:
```bash
cd proof-submission
```
Initialize an NPM project:
```bash
npm init -y && npm pkg set type=module
```
Install axios and dotenv:
```bash
npm i axios dotenv
```

Let's create a ``.env`` file to store our ``API_KEY``, which will be used later to send proofs for verification using Relayer. Use the following code snippet to fill up your ``.env`` file. To use the relayer you need an ``API Key``. 
Create your own API key by signing up [here for mainnet](https://relayer.horizenlabs.io) or [here for testnet](https://relayer-testnet.horizenlabs.io). 
```bash
API_KEY = "generate your API key"
```

Create a new file named ``index.js`` as the entrypoint for our application. Open ``index.js`` in your IDE and start with import neccesary packages :
```js
import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();
```

After this let's initialize our API URL. 

For mainnet:
```js
const API_URL = 'https://relayer-api-mainnet.horizenlabs.io/api/v1';
```
For testnet:  
```js
const API_URL = 'https://relayer-api-testnet.horizenlabs.io/api/v1';
```

**API Documentation**

Swagger docs are available for both environments and provide detailed information about each endpoint, expected payloads, and responses.
Refer to them when integrating or debugging your API calls:
- Mainnet: https://relayer-api-mainnet.horizenlabs.io/docs
- Testnet: https://relayer-api-testnet.horizenlabs.io/docs
---
We would also need to import the required files we have generated already in previous tutorials, which are proof, verification key and public inputs. Use the following code snippets:

<Tabs groupId="import-files">
<TabItem value="circom" label="Circom">
```js
const proof = JSON.parse(fs.readFileSync("./data/proof.json"));
const publicInputs = JSON.parse(fs.readFileSync("./data/public.json"));
const key = JSON.parse(fs.readFileSync("./data/main.groth16.vkey.json"));
```
</TabItem>
<TabItem value="r0" label="Risc Zero">
```js
const proof = JSON.parse(fs.readFileSync("../my_project/proof.json")); // Following the Risc Zero tutorial
```
</TabItem>
<TabItem value="ultrahonk" label="Ultrahonk">
```js
const proof = fs.readFileSync('../target/zkv_proof.hex', 'utf-8');
const publicInputs = fs.readFileSync('../target/zkv_pubs.hex', 'utf-8');
const vkey = fs.readFileSync('../target/zkv_vk.hex', 'utf-8');
```
</TabItem>
<TabItem value="ultraplonk" label="Ultraplonk">
```js
const bufvk = fs.readFileSync("./assets/noir/vk");
const bufproof = fs.readFileSync("./assets/noir/proof");
const base64Proof = bufproof.toString("base64");
const base64Vk = bufvk.toString("base64");
```
</TabItem>
<TabItem value="sp1" label="SP1">
```js
const proof = JSON.parse(fs.readFileSync("../my_project/proof.json")); // Following the SP1 tutorial
```
</TabItem>
</Tabs>

:::info
Next we will be writing the core logic to send proofs to zkVerify for verification.
All the following code snippets should be inserted within async main function.
```js
async function main() {
  // Required code
}

main();
```
:::

Once you have all the requirements imported, we will start by registering our verification key. We can do this by calling a ``GET`` endpoint named ``register-vk`` on our relayer service. We will also need to create a params object with all the necessary information about the verification key, which will be sent in the API call. Once we register the verification key, we will store the ``vkHash`` in a json file which can be used in subsequent API verification calls.

<Tabs groupId="register-vk">
<TabItem value="circom" label="Circom">
```js
if(!fs.existsSync("circom-vkey.json")) {
    try {
        const regParams = {
            "proofType": "groth16",
            "proofOptions": {
                "library": "snarkjs",
                "curve": "bn128"
            },
            "vk": key
        }
        const regResponse = await axios.post(`${API_URL}/register-vk/${process.env.API_KEY}`, regParams);
        fs.writeFileSync(
            "circom-vkey.json",
            JSON.stringify(regResponse.data)
        );
    } catch(error) {
        fs.writeFileSync(
            "circom-vkey.json",
            JSON.stringify(error.response.data)
        );
    }
}
const vk = JSON.parse(fs.readFileSync("circom-vkey.json"));
```
</TabItem>
<TabItem value="r0" label="Risc Zero">
```js
if (!fs.existsSync("r0-vkey.json")) {
    // Registering the verification key
    try {
        const regParams = {
            "proofType": "risc0",
            "proofOptions": {
                "version": "V2_1"
            },
            "vk": proof.image_id
        }
        const regResponse = await axios.post(`${API_URL}/register-vk/${process.env.API_KEY}`, regParams);
        fs.writeFileSync(
            "r0-vkey.json",
            JSON.stringify(regResponse.data)
        );
    } catch(error) {
        fs.writeFileSync(
            "r0-vkey.json",
            JSON.stringify(error.response.data)
        );
    }
}

const vk = JSON.parse(fs.readFileSync("r0-vkey.json"));
```
</TabItem>
<TabItem value="ultrahonk" label="Ultrahonk">
```js
if(!fs.existsSync("noir-vkey.json")) {
    // Registering the verification key
    try {
        const regParams = {
            "proofType": "ultrahonk",
            "vk": vkey.split("\n")[0]
        }
        const regResponse = await axios.post(`${API_URL}/register-vk/${process.env.API_KEY}`, regParams);
        fs.writeFileSync(
            "noir-vkey.json",
            JSON.stringify(regResponse.data)
        );
    } catch(error) {
        fs.writeFileSync(
            "noir-vkey.json",
            JSON.stringify(error.response.data)
        );
    }
}
const vk = JSON.parse(fs.readFileSync("noir-vkey.json"));
```
</TabItem>
<TabItem value="ultraplonk" label="Ultraplonk">
```js
if (!fs.existsSync("noir-vkey.json")) {
    // Registering the verification key
    try {
        const regParams = {
            "proofType": "ultraplonk",
            "proofOptions": {
                "numberOfPublicInputs": 1
            },
            "vk": base64Vk
        }
        const regResponse = await axios.post(`${API_URL}/register-vk/${process.env.API_KEY}`, regParams);
        fs.writeFileSync(
            "noir-vkey.json",
            JSON.stringify(regResponse.data)
        );
    } catch(error) {
        fs.writeFileSync(
            "noir-vkey.json",
            JSON.stringify(error.response.data)
        );
    }
}
const vk = JSON.parse(fs.readFileSync("noir-vkey.json"));
```
</TabItem>
<TabItem value="sp1" label="SP1">
```js
if (!fs.existsSync("sp1-vkey.json")) {
    // Registering the verification key
    try {
        const regParams = {
            "proofType": "sp1",
            "vk": proof.image_id
        }
        const regResponse = await axios.post(`${API_URL}/register-vk/${process.env.API_KEY}`, regParams);
        fs.writeFileSync(
            "sp1-vkey.json",
            JSON.stringify(regResponse.data)
        );
    } catch(error) {
        fs.writeFileSync(
            "sp1-vkey.json",
            JSON.stringify(error.response.data)
        );
    }
}

const vk = JSON.parse(fs.readFileSync("sp1-vkey.json"));
```
</TabItem>
</Tabs>

After registering our verification key, we will start the verification process by calling a ``POST`` endpoint named ``submit-proof``. We will also need to create a params object with all the necessary information about the proof and the vkHash we got after registering our verification key, which will be sent in the API call. If you want to aggregate the verified proof(want to verify the proof aggregation on connected chains like Sepolia, Base Sepolia etc) check the code snippets with aggregation.
<Tabs groupId="aggregated-submission">
<TabItem value="without-aggregation" label="Without Aggregation">
<Tabs groupId="submit-proof">
<TabItem value="circom" label="Circom">
```js
const params = {
    "proofType": "groth16",
    "vkRegistered": true,
    "proofOptions": {
        "library": "snarkjs",
        "curve": "bn128"
    },
    "proofData": {
        "proof": proof,
        "publicSignals": publicInputs,
        "vk": vk.vkHash || vk.meta.vkHash
    }    
}

const requestResponse = await axios.post(`${API_URL}/submit-proof/${process.env.API_KEY}`, params)
console.log(requestResponse.data)
```
</TabItem>
<TabItem value="r0" label="Risc Zero">
```js
const params = {
    "proofType": "risc0",
    "vkRegistered": true,
    "proofOptions": {
        "version": "V2_1"
    },
    "proofData": {
        "proof": proof.proof,
        "publicSignals": proof.pub_inputs,
        "vk": vk.vkHash || vk.meta.vkHash
    }
}

const requestResponse = await axios.post(`${API_URL}/submit-proof/${process.env.API_KEY}`, params)
console.log(requestResponse.data)
```
</TabItem>
<TabItem value="ultrahonk" label="Ultrahonk">
```js
const params = {
    "proofType": "ultrahonk",
    "vkRegistered": true,
    "proofData": {
        "proof": proof.split("\n")[0],
        "vk": vk.vkHash || vk.meta.vkHash,
        "publicSignals": publicInputs.split("\n").slice(0,-1)
    }
}

const requestResponse = await axios.post(`${API_URL}/submit-proof/${process.env.API_KEY}`, params)
console.log(requestResponse.data)
```
</TabItem>
<TabItem value="ultraplonk" label="Ultraplonk">
```js
const params = {
    "proofType": "ultraplonk",
    "vkRegistered": true,
    "proofOptions": {
        "numberOfPublicInputs": 1 // Replace this for the number of public inputs your circuit support
    },
    "proofData": {
        "proof": base64Proof,
        "vk": vk.vkHash || vk.meta.vkHash
    }
}

const requestResponse = await axios.post(`${API_URL}/submit-proof/${process.env.API_KEY}`, params)
console.log(requestResponse.data)
```
</TabItem>
<TabItem value="sp1" label="SP1">
```js
const params = {
    "proofType": "sp1",
    "vkRegistered": true,
    "proofData": {
        "proof": proof.proof,
        "publicSignals": proof.pub_inputs,
        "vk": vk.vkHash || vk.meta.vkHash
    }
}

const requestResponse = await axios.post(`${API_URL}/submit-proof/${process.env.API_KEY}`, params)
console.log(requestResponse.data)
```
</TabItem>
</Tabs>
</TabItem>
<TabItem value="with-aggregation" label="With Aggregation">
We need to define the chainId where we want to verify our aggregated proof. You can find the chain ID for all the supported networks [here](../05-contract-addresses.md)
<Tabs groupId="submit-proof">
<TabItem value="circom" label="Circom">
```js
const params = {
    "proofType": "groth16",
    "vkRegistered": true,
    "chainId": 11155111,
    "proofOptions": {
        "library": "snarkjs",
        "curve": "bn128"
    },
    "proofData": {
        "proof": proof,
        "publicSignals": publicInputs,
        "vk": vk.vkHash || vk.meta.vkHash
    }    
}

const requestResponse = await axios.post(`${API_URL}/submit-proof/${process.env.API_KEY}`, params)
console.log(requestResponse.data)
```
</TabItem>
<TabItem value="r0" label="Risc Zero">
```js
const params = {
    "proofType": "risc0",
    "vkRegistered": true,
    "chainId": 11155111,
    "proofOptions": {
        "version": "V2_1"
    },
    "proofData": {
        "proof": proof.proof,
        "publicSignals": proof.pub_inputs,
        "vk": vk.vkHash || vk.meta.vkHash
    }
}

const requestResponse = await axios.post(`${API_URL}/submit-proof/${process.env.API_KEY}`, params)
console.log(requestResponse.data)
```
</TabItem>
<TabItem value="ultrahonk" label="Ultrahonk">
```js
const params = {
    "proofType": "ultrahonk",
    "vkRegistered": true,
    "chainId": 11155111,
    "proofData": {
        "proof": proof.proof,
        "publicSignals": proof.pub_inputs,
        "vk": vk.vkHash || vk.meta.vkHash
    }
}

const requestResponse = await axios.post(`${API_URL}/submit-proof/${process.env.API_KEY}`, params)
console.log(requestResponse.data)
```
</TabItem>
<TabItem value="ultraplonk" label="Ultraplonk">
```js
const params = {
    "proofType": "ultraplonk",
    "vkRegistered": true,
    "chainId": 11155111,
    "proofOptions": {
        "numberOfPublicInputs": 1 // Replace this for the number of public inputs your circuit support
    },
    "proofData": {
        "proof": base64Proof,
        "vk": vk.vkHash || vk.meta.vkHash
    }
}

const requestResponse = await axios.post(`${API_URL}/submit-proof/${process.env.API_KEY}`, params)
console.log(requestResponse.data)
```
</TabItem>
<TabItem value="sp1" label="SP1">
```js
const params = {
    "proofType": "sp1",
    "vkRegistered": true,
    "chainId": 11155111,
    "proofData": {
        "proof": proof.proof,
        "publicSignals": proof.pub_inputs,
        "vk": vk.vkHash || vk.meta.vkHash
    }
}

const requestResponse = await axios.post(`${API_URL}/submit-proof/${process.env.API_KEY}`, params)
console.log(requestResponse.data)
```
</TabItem>
</Tabs>
</TabItem>
</Tabs>


After sending the verification request to the relayer, we can fetch the status of our request using the ``jobId`` returned in the response of the previous API call. To get the status, we will be making a ``GET`` API call to ``job-status`` endpoint. We want to wait till our proof is finalized on zkVerify, thus we will run a loop waiting for 5 seconds between multiple API calls.

<Tabs groupId="aggregated-listening">
<TabItem value="without-aggregation" label="Without Aggregation">
```js
if (requestResponse.data.optimisticVerify !== "success") {
    console.error("Proof verification, check proof artifacts");
    return;
}

while(true) {
    const jobStatusResponse = await axios.get(`${API_URL}/job-status/${process.env.API_KEY}/${requestResponse.data.jobId}`);
    if(jobStatusResponse.data.status === "Finalized"){
        console.log("Job finalized successfully");
        console.log(jobStatusResponse.data);
        break;
    }else{
        console.log("Job status: ", jobStatusResponse.data.status);
        console.log("Waiting for job to finalize...");
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds before checking again
    }
}
```

Next run this script by running ``node index.js`` command. You should get a response similar to the following :- 
```json
{
  jobId: '23382e04-3d57-11f0-af7b-32a805cdbfd3',
  optimisticVerify: 'success'
}
Job status:  Submitted
Waiting for job to finalize...
Job status:  IncludedInBlock
Waiting for job to finalize...
Job status:  IncludedInBlock
Waiting for job to finalize...
Job finalized successfully
{
  jobId: '23382e04-3d57-11f0-af7b-32a805cdbfd3',
  status: 'Finalized',
  statusId: 4,
  proofType: 'groth16',
  chainId: null,
  createdAt: '2025-05-30T13:08:11.000Z',
  updatedAt: '2025-05-30T13:08:27.000Z',
  txHash: '0xc0d85e5d50fff2bb5d192ee108664878e228d7fc3c1faa2d23da891832873d51',
  blockHash: '0xcd574432b1a961305bbeb2c6b6ef399e1ae5102593846756cbb472bfd53d7d43',
  transactionDetails: {}
}
```
</TabItem>
<TabItem value="with-aggregation" label="With Aggregation">
```js
if(requestResponse.data.optimisticVerify !== "success"){
    console.error("Proof verification, check proof artifacts");
    return;
}

while(true) {
    const jobStatusResponse = await axios.get(`${API_URL}/job-status/${process.env.API_KEY}/${requestResponse.data.jobId}`);
    if (jobStatusResponse.data.status === "Aggregated") {
        console.log("Job aggregated successfully");
        console.log(jobStatusResponse.data);
        fs.writeFileSync("aggregation.json", JSON.stringify({...jobStatusResponse.data.aggregationDetails, aggregationId: jobStatusResponse.data.aggregationId}))
        break;
    } else {
        console.log("Job status: ", jobStatusResponse.data.status);
        console.log("Waiting for job to aggregated...");
        await new Promise(resolve => setTimeout(resolve, 20000)); // Wait for 5 seconds before checking again
    }
}
```

Next run this script by running ``node index.js`` command. You should get a response similar to the following :- 
```json
{
  jobId: '4e77e1c5-4d36-11f0-8eb5-b2e0eb476089',
  optimisticVerify: 'success'
}
Job status:  Submitted
Waiting for job to aggregated...
Job status:  AggregationPending
Waiting for job to aggregated...
Job aggregated successfully
{
  jobId: '4e77e1c5-4d36-11f0-8eb5-b2e0eb476089',
  status: 'Aggregated',
  statusId: 6,
  proofType: 'groth16',
  chainId: 11155111,
  createdAt: '2025-06-19T17:53:29.000Z',
  updatedAt: '2025-06-19T17:54:05.000Z',
  txHash: '0x1087c19de3d4b6dc5c8b20aec8a640d94ad6862e57634b5cf48defcabea3a92e',
  blockHash: '0x5c8279c370ac8611e5dc5810fabf6078e1997c0c323fc2b26de74ff420e27c65',
  aggregationId: 29537,
  statement: '0xd72c67547100dd6f00c60f05f4bb7cf33f22b077e6a76125e911e091197bd55c',
  aggregationDetails: {
    receipt: '0x84c25ba051bc3cc66a74bcf2169befad5f348d0ad7b24efd6c68c70a25783ad2',
    receiptBlockHash: '0x11802c585a367a02df4b0555d1310ff96fa5490fb6e8da8ebefde3f537ef5cb7',
    root: '0x84c25ba051bc3cc66a74bcf2169befad5f348d0ad7b24efd6c68c70a25783ad2',
    leaf: '0xd72c67547100dd6f00c60f05f4bb7cf33f22b077e6a76125e911e091197bd55c',
    leafIndex: 6,
    numberOfLeaves: 8,
    merkleProof: [
      '0xc714a8b348a529a98fd65c547d7d0819afd3be840fdbad95f04c5ce026424cd4',
      '0x958bf24c3a974ce5ad51461bdea442de1907d90d237bba2be3aaca3ec609d777',
      '0x9367529337c04392b71c3174eaaba23fa2c8d8b599b82ec1ec1a420bbf2e2d77'
    ]
  }
}
```

And you would now have a new file named ``aggregation.json`` which will have the aggregation details which can be used later during smart contract verification.
</TabItem>
</Tabs>

## Job Status

In this example, we demonstrated how to wait for "Finalized" status for our proof verification. There are multiple proof status you can wait for. You can check all the status available following : 

- Queued - Proof accepted and waiting for processing
- Valid - Proof passed optimistic verification
- Submitted - Proof submitted to blockchain/mempool
- IncludedInBlock - Proof transaction included in a block
- Finalized - Proof transaction finalized on-chain
- Failed - Proof processing failed

:::note
All the status mentioned below, would not be generated if chainId is not provided in the submit proof request
:::

- AggregationPending - Proof ready for aggregation
- Aggregated - Proof successfully aggregated and published
- AggregationPublished - Proof aggregation successfully published to zkVerify contract on destination chain

## Resources
1. Submit feedback/ or an issue: [Relayer API: Feedback](https://forms.gle/Gn4dVoFsCPL6zuy17)

2. Submit a new feature request: [Relayer API: New Feature Requests](https://forms.gle/xcrEChxv8b3EQZVs7)

3. Reach out to us on [Discord](https://discord.gg/zkverify) or [relayer-support@horizenlabs.io](mailto:relayer-support@horizenlabs.io) if you like to discuss potential partnerships
