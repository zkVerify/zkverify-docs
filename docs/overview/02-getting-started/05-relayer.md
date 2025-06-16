---
title: Verifying proofs with Relayer
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

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

Let's create a ``.env`` file to store our ``API_KEY``, which will be used later to send proofs for verification using Relayer. Use the following code snippet to fill up your ``.env`` file. To use the relayer you need to get an ``API Key``. You can try to contact any of the team members or open a ticket on our [Discord](https://discord.gg/zkverify). 
```bash
API_KEY = "get your API Key from Horizen Labs team"
```

Create a new file named ``index.js`` as the entrypoint for our application. Open ``index.js`` in your IDE and start with import neccesary packages :
```js
import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();
```

After this let's initialize our API URL. You can also check the Swagger docs for the Relayer API [here](https://relayer-api.horizenlabs.io/docs) 
```js
const API_URL = 'https://relayer-api.horizenlabs.io/api/v1';
```

We would also need to import the required files we have generated already in previous tutorials, which are proof, verification key and public inputs. Use the following code snippets :

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
<TabItem value="noir" label="Noir">

:::note
Please make sure, you have latest version of rust installed on your machine
:::

To use the relayer, we need to convert our binary proof artifacts to hex. We need to use ``noir-cli`` for this conversion. Let's start by downloading our ```noir-cli``` toolkit by cloning our github repository.
```bash
git clone https://github.com/zkVerify/ultraplonk_verifier.git
```

After downloading, we need to build the toolkit so make sure you have rust installed. To build the toolkit run the following command:
```bash
cargo install --features bins --path .
```

Now run the following commands to convert the generated files to required hex formats:
```bash
# noir-cli proof-data -n <num_public_inputs> --input-proof <bb_proof path> --output-proof <zkv_proof path> --output-pubs <zkv_pubs path>
noir-cli proof-data -n 1 --input-proof ./target/proof --output-proof proof.hex --output-pubs pub.hex

# noir-cli key --input <bb_vk path> --output <zkv_vk path>
noir-cli key --input ./target/vk --output vk.hex
```

After running all these commands, you would have generated three files namely proof.hex, pub.hex and vk.hex. We will be using all these files while submitting proof for verification. Come back to our ``index.js`` file and paste the following code snippet :- 

```js
const vkhex = fs.readFileSync("../hello_world/vk.hex").toString();
const proofhex = fs.readFileSync("../hello_world/proof.hex").toString();
const pubhex = fs.readFileSync("../hello_world/pub.hex").toString();
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

Once you have all the requirements imported, we will start the verification process by calling a ``POST`` endpoint named ``submit-proof``. We will also need to create a params object with all the necessary information about the proof, which will be sent in the API call.

<Tabs groupId="submit-proof">
<TabItem value="circom" label="Circom">
```js
const params = {
    "proofType": "groth16",
    "vkRegistered": false,
    "proofOptions": {
        "library": "snarkjs",
        "curve": "bn128"
    },
    "proofData": {
        "proof": proof,
        "publicSignals": publicInputs,
        "vk": key
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
    "vkRegistered": false,
    "proofOptions": {
        "version": "V1_2" // Replace this with the Risc0 version 
    },
    "proofData": {
        "proof": proof.proof,
        "publicSignals": proof.pub_inputs,
        "vk": proof.image_id
    }
}

const requestResponse = await axios.post(`${API_URL}/submit-proof/${process.env.API_KEY}`, params)
console.log(requestResponse.data)
```
</TabItem>
<TabItem value="noir" label="Noir">
```js
const params = {
    "proofType": "ultraplonk",
    "vkRegistered": false,
    "proofData": {
        "proof": proofhex.split("\n")[0],
        "publicSignals": pubhex.split("\n").slice(0,-1),
        "vk": vkhex.split("\n")[0]
    }
}

const requestResponse = await axios.post(`${API_URL}/submit-proof/${process.env.API_KEY}`, params)
console.log(requestResponse.data)
```
</TabItem>
</Tabs>

After sending the verification request to the relayer, we can fetch the status of our request using the ``jobId`` returned in the response of the previous API call. To get the status, we will be making a ``GET`` API call to ``job-status`` endpoint. We want to wait till our proof is finalized on zkVerify, thus we will run a loop waiting for 5 seconds between multiple API calls.

```js
if(requestResponse.data.optimisticVerify != "success"){
    console.error("Proof verification, check proof artifacts");
    return;
}

while(true){
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

## Job Status

In this example, we demonstrated how to wait for "Finalized" status for our proof verification. There are multiple proof status you can wait for. You can check all the status available following : 

- Queued - Proof accepted and waiting for processing
- Valid - Proof passed optimistic verification
- Submitted - Proof submitted to blockchain/mempool
- IncludedInBlock - Proof transaction included in a block
- Finalized - Proof transaction finalized on-chain

:::note
All the status mentioned below, would not be generated if chainId is not provided in the submit proof request
:::

- AggregationPending - Proof ready for aggregation
- Aggregated - Proof successfully aggregated and published
- AggregationPublished - Proof aggregation successfully published to zkVerify contract on destination chain
- Failed - Proof processing failed