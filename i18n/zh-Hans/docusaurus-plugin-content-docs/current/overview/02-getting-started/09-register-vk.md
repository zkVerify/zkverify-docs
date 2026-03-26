---
title: 注册 Verification Key
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

本教程介绍如何在 zkVerify 上注册 verification key。注册后，提交证明时可用 vkHash 替代 vkey，显著节省手续费。

:::note
每个电路只需注册一次 vkey。如果只是黑客松/POC，可跳过。
:::

开始前请确保已完成 [此前教程](./06-zkverify-js.md)。我们会编辑之前用到的文件。

先创建 ``register.js``，写入在 zkVerify 注册 vkey 的逻辑。打开后从 ```zkVerify JS``` 与 ``dotenv`` 导入下列组件：

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
<TabItem value="ezkl" label="Ezkl">
```js
import { zkVerifySession, ZkVerifyEvents } from "zkverifyjs";
import dotenv from 'dotenv';
dotenv.config();
```
</TabItem>
</Tabs>

还需导入此前生成的 verification key，示例如下：
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
const vk = fs.readFileSync('../target/zkv_vk.hex', 'utf-8');
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
<TabItem value="ezkl" label="Ezkl">
```js
import fs from "fs";
const vk = fs.readFileSync('../target/zkv_vk.hex', 'utf-8');
```
</TabItem>
</Tabs>

:::info
接下来编写核心逻辑。以下代码需放在 async main 函数中：
```js
async function main(){
  // Required code
}

main();
```
:::

导入完成后，先用带 $tVFY 的账号在 Volta 测试网上实例化 session：
```js
const session = await zkVerifySession.start().Volta().withAccount(process.env.SEED_PHRASE);
```

然后用 session 调用 ``registerVerificationKey()``，监听交易的 ``Finalized`` 事件，并将 ``vkHash`` 写入 ``vkey.json``：

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
const {regevent} = await session.registerVerificationKey().ultrahonk().execute(vk.split("\n")[0]); 

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
<TabItem value="ezkl" label="Ezkl">
```js
const {regevent} = await session.registerVerificationKey().ezkl().execute(vk.split("\n")[0]); 

regevent.on(ZkVerifyEvents.Finalized, (eventData) => {
    console.log('Registration finalized:', eventData);
    fs.writeFileSync("vkey.json", JSON.stringify({"hash": eventData.statementHash}, null, 2));
    return eventData.statementHash
});
```
</TabItem>
</Tabs>

使用 ``node register.js`` 运行脚本完成注册。注册后会生成 ``vkey.json``，格式如下：
```json
{
  "vkey": "0x828c736b33ab492251a8b275468a29ce06e98fc833c0c7f0bc7f6272b300c05b"
}
```

接着修改现有 ``index.js``，用已注册的 vkHash 替代直接使用 vkey。先导入 ``vkey.json``，调用 ``verify()`` 时使用 ``withRegisteredVk()``，并将 vkHash 传入：

Paste the following code snippet at the start of the ``main`` function.
```js
const vkey = JSON.parse(fs.readFileSync("./vkey.json")) //Importing the registered vkhash
```

将现有 ``verify()`` 函数替换为以下片段：
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
    .ultrahonk() // Make sure to replace the numberOfPublicInputs field as per your circuit 
    .withRegisteredVk() 
    .execute({proofData: {
        vk: vkey.hash,
        proof: proof.split("\n")[0],
        publicSignals: publicInputs.split("\n").slice(0,-1)
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
<TabItem value="ezkl" label="Ezkl">
```js
const {events} = await session.verify()
    .ezkl()
    .withRegisteredVk() 
    .execute({proofData: {
        vk: vkey.hash,
        proof: proof.split("\n")[0],
        publicSignals: publicInputs.split("\n").slice(0,-1)
    }, domainId: 0});
```
</TabItem>
</Tabs>

现在可用 ``node index.js`` 运行脚本。执行后会生成 ``aggregation.json``，包含在目标链验证聚合所需的全部信息，例如：
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
