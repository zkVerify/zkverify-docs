---
title: Galxe Identity Protocol
---

:::info
教程所用代码可在[这里](https://github.com/zkVerify/explorations/tree/main/galxe-identity)查看
:::

Galxe Identity Protocol 是无许可的自主管理身份基础设施，借助零知识证明，用户可安全私密地拥有、管理、分享可验证凭证；也为构建 Sybil 防护、声誉/信用系统、个人数据市场、去中心化评价系统等提供机会。

Galxe Identity Protocol SDK 可利用 zkVerify 的证明验证技术，大幅降低链上验证成本。本文演示如何用 zkVerifyJS 在 zkVerify 上验证凭证。

先新建目录、初始化 npm 并安装依赖（galxe-identity-zkVerify、ethers、zkVerifyJS）：

```bash
# This will create a new directory for our project
mkdir galxe-identity-zkVerify

# Moving inside our directory
cd galxe-identity-zkVerify

# Initializing our project
npm init -y && npm pkg set type=module

# Installing required packages
npm i @galxe-identity-protocol/sdk ethers zkverifyjs
```

创建 `.env`，粘贴下述内容，将 `<SEED-PHRASE>` 替换为你的钱包助记词：

```bash
ZKVERIFY_SIGNER_PK = <SEED-PHRASE>
```

然后引入依赖，并初始化 `MAINNET_RPC` 与 `dummyIssuerEvmAddr`：

```js
import {
  prepare,
  credential,
  evm,
  credType,
  errors,
  user,
  issuer,
  utils,
  babyzkTypes,
} from "@galxe-identity-protocol/sdk";
import { ethers } from "ethers";
import {
  CurveType,
  Library,
  ZkVerifyEvents,
  zkVerifySession,
} from "zkverifyjs";

const unwrap = errors.unwrap;

const MAINNET_RPC = "https://1rpc.io/eth";

const provider = new ethers.JsonRpcProvider(MAINNET_RPC);

// 这是主网上注册的演示 issuer EVM 地址。
// 它授权了人人可见的私钥，切勿用于生产。
const dummyIssuerEvmAddr = "0x15f4a32c40152a0f48E61B7aed455702D1Ea725e";
```

接着写凭证签发函数，需要用户 EVM 地址与 Identity commitment。先创建凭证类型（本教程使用 Scalar），再由 issuer 生成并签名凭证。

```js
async function issuingProcess(userEvmAddr, userIdc) {
  // 1. 先创建凭证类型，此处用基础类型 Scalar。
  const typeSpec = credType.primitiveTypes.scalar;
  const tp = unwrap(credType.createTypeFromSpec(typeSpec));

  // 2. 基于类型创建凭证，此时 issuer 决定对用户的“主张”。
  // 本例凭证表示交易次数，从以太坊网络获取。
  const txCount = await provider.getTransactionCount(userEvmAddr);
  // contextID 为凭证上下文的唯一标识，本例用字符串 "Number of transactions"。
  // 注意：需先在链上注册 contextID 才可见。
  const contextID = credential.computeContextID("Number of transactions");
  // 创建凭证。
  const newCred = unwrap(
    credential.Credential.create(
      {
        type: tp,
        contextID: contextID,
        userID: BigInt(userEvmAddr),
      },
      {
        val: BigInt(txCount).toString(), // credential value, number of transactions
      }
    )
  );
  // 如需附加属性，可在 attachments 中添加。
  // 这些属性不参与零知识证明，但会被 issuer 签名，需在签名前添加。
  newCred.attachments["creativity"] = "uncountable";

  // 3. 签名凭证。凭证需由 issuer 签名，issuer 至少要在指定 ChainID 上注册；
  // 若能在更多链注册更利于互操作；签名 key 的 keyID 需在链上处于激活状态。
  // 演示中使用公开密钥的 dummy issuer，已在以太坊主网注册并激活下述 key，勿用于生产。
  const issuerID = BigInt(dummyIssuerEvmAddr);
  const issuerChainID = BigInt(1); // mainnet
  // 用于签名凭证的模拟私钥，已由 dummy issuer 在主网注册并激活。
  const dummyKey = utils.decodeFromHex(
    "0xfd60ceb442aca7f74d2e56c1f0e93507798e8a6e02c4cd1a5585a36167fa7b03"
  );
  const issuerPk = dummyKey;
  // 使用私钥、issuerID、issuerChainID 创建 issuer 对象。
  const myIssuer = new issuer.BabyzkIssuer(issuerPk, issuerID, issuerChainID);
  // 使用唯一签名 id 与过期时间，对凭证（绑定用户 identity commitment）签名。
  myIssuer.sign(newCred, {
    sigID: BigInt(100),
    expiredAt: BigInt(
      Math.ceil(new Date().getTime() / 1000) + 7 * 24 * 60 * 60
    ), // 假定 7 天后过期
    identityCommitment: userIdc,
  });

  // 返回给用户。
  return newCred;
}
```

再写证明生成函数，入参为用户与凭证数据。先构造 external nullifier，下载证明生成 gadgets，再列出要检查的条件（如凭证在 3 天后仍有效、`val` 介于 500~5000）。

```js
async function proofGenProcess(myCred, u) {
  // issuer 向用户签发代表其以太坊交易次数的凭证后，
  // 用户可生成 zk 证明，证明交易次数在 500~5000 之间。
  // 先确定 proof 的 external nullifier。
  const externalNullifier = utils.computeExternalNullifier(
    "Galxe Identity Protocol tutorial's verification"
  );
  // 获取证明生成 gadgets。通常存储在远端且较大（3-10MB），
  // 因此在函数外提前拉取，建议本地缓存。
  console.log("downloading proof generation gadgets...");
  const proofGenGagets = await user.User.fetchProofGenGadgetsByTypeID(
    myCred.header.type,
    provider
  );
  console.log("proof generation gadgets are downloaded successfully.");
  // 生成证明，假设需验证凭证在 3 天后仍有效。
  const expiredAtLowerBound = BigInt(
    Math.ceil(new Date().getTime() / 1000) + 3 * 24 * 60 * 60
  );
  // 不暴露凭证实际 id（本例为 evm 地址）
  const equalCheckId = BigInt(0);
  // 而是声明化名 Mr.Deadbeef，验证方需在验证证明后确认该化名。
  const pseudonym = BigInt("0xdeadbeef");
  // 证明 `val` 在 500~5000（含）之间。
  const proof = await u.genBabyzkProofWithQuery(
    u.getIdentityCommitment("evm"),
    myCred,
    proofGenGagets,
    `
      {
        "conditions": [
          {
            "identifier": "val",
            "operation": "IN",
            "value": {
              "from": "500",
              "to": "5000"
            }
          }
        ],
        "options": {
          "expiredAtLowerBound": "${expiredAtLowerBound}",
          "externalNullifier": "${externalNullifier}",
          "equalCheckId": "${equalCheckId}",
          "pseudonym": "${pseudonym}"
        }
      }
      `
  );
  return proof;
}
```

再写专门用 zkVerify 验证明的函数，入参为 proof 与 vk。先用助记词连接 zkVerify Volta Testnet，调用 verify 并传入证明数据；提交后监听 `IncludedInBlock` 与 `Finalized` 事件。

```js
async function executeVerificationWithZkVerify(proof, vk) {
  try {
    // Start a new zkVerifySession on our testnet
    const session = await zkVerifySession
      .start()
      .Volta()
      .withAccount(process.env.SEED_PHRASE);

    // Execute the verification transaction
    const { events, transactionResult } = await session
      .verify()
      .groth16({ library: Library.snarkjs, curve: CurveType.bn254 })
      .execute({
        proofData: {
          vk: vk,
          proof: proof.proof,
          publicSignals: proof.publicSignals,
        },
      });

    // Listen for the 'includedInBlock' event
    events.on(ZkVerifyEvents.IncludedInBlock, (eventData) => {
      console.log("Transaction included in block:", eventData);
    });

    // Listen for the 'finalized' event
    events.on(ZkVerifyEvents.Finalized, (eventData) => {
      console.log("Transaction finalized:", eventData);
    });

    // Handle errors during the transaction process
    events.on("error", (error) => {
      console.error("An error occurred during the transaction:", error);
      throw error;
    });

    // Await the final transaction result
    const transactionInfo = await transactionResult;
    console.log("Transaction completed successfully:", transactionInfo);
    return transactionInfo;
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
}
```

再写函数从链上 registry 获取 proof verification key，并在其中调用 `executeVerificationWithZkVerify`：

```js
async function verifyWithZkVerify(proof) {
  const expectedTypeID = credType.primitiveTypes.scalar.type_id;

  // When using zkVerify on-chain verification, you must first get the verification key.
  // You can embed the verification key in your application, or fetch it from a remote server.
  // We will fetch the verification key from the chain in this example.
  // The first step is to do a proof verification, making sure that the zk proof is valid.
  const tpRegistry = evm.v1.createTypeRegistry({
    signerOrProvider: provider,
  });
  const verifier = await tpRegistry.getVerifier(
    expectedTypeID,
    credential.VerificationStackEnum.BabyZK
  );
  const vKey = await verifier.getVerificationKeysRaw();
  console.log(
    "on zkVerify-chain proof verification start, executing verification transaction"
  );
  const verifyResult = await executeVerificationWithZkVerify(proof, vKey);
  console.log("on zkVerify-chain proof verification result: ", verifyResult);

  return true;
}
```

关键组件齐备后，编写 `main` 函数按顺序调用，并初始化用户：

```js
async function main() {
  // prepare must be called by the application before any other function.
  await prepare();

  // 第一步：创建带随机身份的用户。应在用户设备上完成并安全存储身份。
  const u = new user.User();
  const evmIdSlice = u.createNewIdentitySlice("evm");

  // 用户的 identity commitment 由 identity slice 的机密计算，可直接从 slice 获取。
  const userIdc = user.User.computeIdentityCommitment(evmIdSlice);

  // 本例使用一个知名以太坊地址。
  const userEvmAddr = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

  // Issuer：签发凭证给用户。
  const myCred = await issuingProcess(userEvmAddr, userIdc);
  console.log("Credential is issued successfully.");
  console.log(myCred.marshal(2));

  // User：生成 zk 证明证明凭证满足条件。
  const proof = await proofGenProcess(myCred, u);
  console.log("Proof is generated successfully.", proof);

  // zkVerify 链验证证明。
  console.log("Starting verification with zkVerify");
  await verifyWithZkVerify(proof);
  console.log("End of verification with zkVerify");

  //console.log("Starting verification with zkVerify and registered verification key");
  //await verifyWithZkVerifyRegisteredZK(proof);
  //console.log("End of verification with zkVerify and registered verification key");

  process.exit(0);
}

main();
```

运行 `node index.js` 可得到类似输出：

```bash
Credential is issued successfully.
{
  "header": {
    "version": "1",
    "type": "3",
    "context": "76531616260669148123754708449894501309630588037",
    "id": "1238012972454248237435767387143779415173800484933"
  },
  "body": {
    "val": "1563"
  },
  "signatures": [
    {
      "metadata": {
        "verification_stack": 1,
        "signature_id": "100",
        "expired_at": "1749453494",
        "identity_commitment": "1259989134017184623625800239683735721994856718727248396828163708430030828485",
        "issuer_id": "125344402375953606533377270523694284815265854046",
        "chain_id": "1",
        "public_key": "GtrdrhiIorbpEkCJb15QN5UgE392xCR1Uhet4A+LLRhaBakE10XuJGktkc90Ql1CcYF+ZOYwEVRp8/KJ0NBrLw=="
      },
      "signature": "1koPcpRunFyOXFh4sJaEm6xiI5w/EYoh/6ZUicMDLRz5sZ5lT3rE+ISwnkMVaVRYiejiJblzDL5fgQBU6m0NAQ==",
      "attachmentsSignature": "5BJbz+KoS3fNM/nIEHZ8dJNnNoI7Sfj9dyVuITPqOxu+7WDqQPZi8hRYWnWHbKwu7WyzaX/FwibgS/PHpY0DBA=="
    }
  ],
  "attachments": {
    "creativity": "uncountable"
  }
}
downloading proof generation gadgets...
proof generation gadgets are downloaded successfully.
Proof is generated successfully. {
  proof: {
    pi_a: [
      '2167318309843308703080768976980918081101918239951051581630205047689579665592',
      '18950616884312561051985981151486117579230800869520891733201293686066467087295',
      '1'
    ],
    pi_b: [ [Array], [Array], [Array] ],
    pi_c: [
      '8134174797835201479799234253457680871672950185709972339767403356386734841650',
      '218628559240678510380495549983027540074765194566418274437030112735513163363',
      '1'
    ],
    protocol: 'groth16',
    curve: 'bn128'
  },
  publicSignals: [
    '3',
    '76531616260669148123754708449894501309630588037',
    '6183930272096350034464122205705723741689903524336819857871755857635000423726',
    '515399344354422600182581914538985155404062012635',
    '3735928559',
    '1749107898',
    '1743582416365651167392966598529843347617363862106697818328310770809664607117',
    '0',
    '500',
    '5000'
  ]
}
Starting verification with zkVerify
on zkVerify-chain proof verification result:  {
  blockHash: '0x4cf46a8697af003ce1c46cf14d2294201e74276e1c7de931b9c9594f6ac137c1',
  status: 'finalized',
  txHash: '0xfe125e43595dca95a0c81884032fcc6587ce869d3e98323ff7fb1915ee769edf',
  proofType: 'groth16',
  domainId: undefined,
  aggregationId: undefined,
  statement: '0x6a6a86054c42dee1835e05fb7428b8bb28c265cd359384504f41b625d1e1c9cc',
  extrinsicIndex: 3,
  feeInfo: {
    payer: 'xpj6bLy33B2edbVhNygK5ZMofS6dUM5ghopmDfZM7ZUiQ8q5H',
    actualFee: '29738472675000000',
    tip: '0',
    paysFee: 'Yes'
  },
  weightInfo: { refTime: '5947692646', proofSize: '0' },
  txClass: 'Normal'
}
End of verification with zkVerify
```

本教程代码可见[此处](https://github.com/Galxe/identity-protocol/blob/main/apps/tutorial/src/useZkVerify.ts)。

恭喜！你已成功签发凭证、生成零知识证明并通过 zkVerify 验证。下一步可探索更进阶的话题，如 [Kurier](../02-getting-started/05-kurier.md) 与 [域聚合](../../architecture/04-proof-aggregation/01-overview.md)。
