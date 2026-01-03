---
title: 使用 Kurier 验证明
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

:::info
本教程用到的代码可在 [这里](https://github.com/zkVerify/tutorials/tree/main/relayer) 查看。
:::

本教程介绍如何使用 Kurier 在 zkVerify 上验证证明。Kurier 是 [Horizen Labs](https://horizenlabs.io) 构建的 REST API，简化 zkVerify 证明验证流程。

:::note
开始前请将 Node JS 升级到最新版本（v24.1.0），用 `node -v` 查看。
:::

新建项目并安装 `axios`，执行：

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

创建 `.env` 存储 `API_KEY`，用于通过 Kurier 提交证明。需先注册获取 API Key（[主网](https://kurier.xyz) 或 [测试网](https://testnet.kurier.xyz)）。

```bash
API_KEY = "generate your API key"
```

新建 `index.js` 作为入口，导入依赖：

```js
import axios from "axios";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
```

初始化 API 地址。

For mainnet:

```js
const API_URL = "https://api.kurier.xyz";
```

For testnet:

```js
const API_URL = "https://api-testnet.kurier.xyz";
```

**API Documentation**

两套环境均提供 Swagger 文档，包含端点、入参与响应，可用于集成与调试：

- Mainnet: https://api.kurier.xyz/docs
- Testnet: https://api-testnet.kurier.xyz/docs

---

还需导入此前生成的 proof、verification key、public inputs，示例如下：

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
<TabItem value="ezkl" label="Ezkl">
```js
const proof = fs.readFileSync('../target/zkv_proof.hex', 'utf-8');
const publicInputs = fs.readFileSync('../target/zkv_pubs.hex', 'utf-8');
const vkey = fs.readFileSync('../target/zkv_vk.hex', 'utf-8');
```
</TabItem>
</Tabs>

:::info
接下来编写核心逻辑提交证明，以下代码放在 async main 函数内：

```js
async function main() {
  // Required code
}

main();
```

:::

导入完成后，先调用 Kurier 的 `register-vk`（POST）注册 verification key，构造包含 vkey 信息的参数，返回的 `vkHash` 存入本地 json，供后续验证使用。

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

````
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
````

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

````
</TabItem>
</Tabs>

注册完成后，调用 `submit-proof`（POST）开始验证，传入 proof 及注册得到的 vkHash。若需聚合（在 Sepolia、Base Sepolia 等链验证聚合），参考带 aggregation 的示例。
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
````

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

````
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
````

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

````
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
````

</TabItem>
</Tabs>
</TabItem>
<TabItem value="with-aggregation" label="With Aggregation">
需要指定聚合验证的 chainId，支持网络的 chainId 见[此处](../../architecture/08-contract-addresses.md)。
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

````
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
````

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

````
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
````

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

````
</TabItem>
</Tabs>
</TabItem>
</Tabs>


提交验证后，可用响应中的 ``jobId`` 查询状态，调用 ``job-status``（GET）。为等待 zkVerify 最终化，可循环轮询（示例中每 5 秒一次）。

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
````

运行 `node index.js`，响应示例：

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

````

运行 ``node index.js``，响应示例：
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
````

此时会生成 `aggregation.json`，包含聚合详情，后续可用于合约验证。
</TabItem>
</Tabs>

## Job Status

上述示例等待状态为 “Finalized”。可关注的状态还有：

- Queued - Proof accepted and waiting for processing
- Valid - Proof passed optimistic verification
- Submitted - Proof submitted to blockchain/mempool
- IncludedInBlock - Proof transaction included in a block
- Finalized - Proof transaction finalized on-chain
- Failed - Proof processing failed

:::note
若 `submit-proof` 未提供 chainId，以下状态不会出现：
:::

- AggregationPending - Proof ready for aggregation
- Aggregated - Proof successfully aggregated and published
- AggregationPublished - Proof aggregation successfully published to zkVerify contract on destination chain

## Resources

1. Submit feedback/ or an issue: [Kurier API: Feedback](https://forms.gle/Gn4dVoFsCPL6zuy17)

2. Submit a new feature request: [Kurier API: New Feature Requests](https://forms.gle/xcrEChxv8b3EQZVs7)

3. 商务合作请联系 [Discord](https://discord.gg/zkverify) 或 [kurier-support@horizenlabs.io](mailto:kurier-support@horizenlabs.io)
