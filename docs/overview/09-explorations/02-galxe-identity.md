---
title: Galxe Identity Protocol
---

Galxe Identity Protocol is a permissionless self-sovereign identity infrastructure. Powered by Zero-Knowledge Proof, you’ll be able to own, manage, and share verifiable credentials securely and privately. Galxe Identity Protocol also presents a diverse range of opportunities for builders to build Sybil prevention algorithms, reputation systems, credit systems, personal data markets, decentralized review systems, and beyond.

Galxe Identity Protocol SDK is capable to utilize zkVerify's proof verification technology to drastically reduce the costly onchain proof verifications. This tutorial will guide you through the process of using zkVerifyJS to verify credentials on zkVerify.

To start with, we will create a new directory, initialize npm, and install required packages(galxe-identity-zkVerify, ethers and zkVerifyJS). Use the following commands:- 
```bash
# This will create a new directory for our project
mkdir galxe-identity-zkVerify

# Moving inside our directory
cd galxe-identity-zkVerify

# Initializing our project
npm init -y && npm pkg set type=module

# Installing required packages
npm i galxe-identity-zkVerify ethers zkverifyjs
```

Create a ``.env`` file and paste the follwoing code snippet. Make sure to replace ``<SEED-PHRASE>`` with your wallet's seed phrase.
```bash
ZKVERIFY_SIGNER_PK = <SEED-PHRASE>
```

Next, we will import all the required dependencies. Also we will initialize the ``MAINNET_RPC`` and a ``dummyIssuerEvmAddr``.
```js
import { prepare, credential, evm, credType, errors, user, issuer, utils, babyzkTypes } from "@galxe-identity-protocol/sdk";
import { ethers } from "ethers";
import { CurveType, Library, VerifyTransactionInfo, VKRegistrationTransactionInfo, ZkVerifyEvents, zkVerifySession } from "zkverifyjs";

const unwrap = errors.unwrap;

const MAINNET_RPC = "https://1rpc.io/eth";

const provider = new ethers.JsonRpcProvider(MAINNET_RPC);

// This is a dummy issuer's EVM address that has been registered on mainnet.
// Because it authroize the private key that is public to everyone,
// it should not be used in production!
const dummyIssuerEvmAddr = "0x15f4a32c40152a0f48E61B7aed455702D1Ea725e";
```

Now, we will create a function for issuing credentials. We will be needing the User's EVM address amd User's Identity commitment. First we will create the type of credential, for this tutorial let's create a Scalar type. Then we will create the credential and sign it by the issuer.
```js
async function issuingProcess(userEvmAddr: string, userIdc: bigint) {
  // 1. First of all, we must create the type of the credential.
  // In this example, Let's use the primitive type Scalar.
  const typeSpec = credType.primitiveTypes.scalar;
  const tp = unwrap(credType.createTypeFromSpec(typeSpec));

  // 2. Creating a credential based on the type.
  // In general, this is when the issuer decides "claims" about the user.
  // Because we are issuing a credential that represents the number of transactions,
  // let's fetch it from the Ethereum network.
  const txCount = await provider.getTransactionCount(userEvmAddr);
  // The contextID is a unique identifier representing the context of the credential.
  // We will just use the string "Number of transactions".
  // NOTE: The contextID must be registered on the chain before issuing the credential for visibility.
  const contextID = credential.computeContextID("Number of transactions");
  // Now, let's create the credential.
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
  // Add additional attributes to the credential attachments, if needed
  // these attributes will not be part of the zero-knowledge proof, but
  // they will be signed by the issuer as well.
  // So, you must add them before signing the credential.
  newCred.attachments["creativity"] = "uncountable";

  // 3. Signing the credential.
  // After the credential is created, it must be signed by the issuer.
  // The issuer must have been registered on the chain, at least on the chain of the supplied ChainID.
  // Registering the issuer on more chains is recommended for better interoperability.
  // Also, the signing key's keyID must be active correspondingly on chains.
  // For demonstration purposes, we use the dummy issuer with a publicly known key.
  // The dummy issuer has been registered on etheruem mainnet, and the following key is also activated.
  // Don't use this issuer or key in production!
  const issuerID = BigInt(dummyIssuerEvmAddr);
  const issuerChainID = BigInt(1); // mainnet
  // A mock private key for the signer, which is used to sign the credential.
  // This key has been registered and activated on mainnet by the dummy issuer.
  const dummyKey = utils.decodeFromHex("0xfd60ceb442aca7f74d2e56c1f0e93507798e8a6e02c4cd1a5585a36167fa7b03");
  const issuerPk = dummyKey;
  // create a new issuer object using the private key, issuerID, and issuerChainID.
  const myIssuer = new issuer.BabyzkIssuer(issuerPk, issuerID, issuerChainID);
  // sign the credential to user's identity commitment, with a unique signature id and expiration date.
  myIssuer.sign(newCred, {
    sigID: BigInt(100),
    expiredAt: BigInt(Math.ceil(new Date().getTime() / 1000) + 7 * 24 * 60 * 60), // assuming the credential will be expired after 7 days
    identityCommitment: userIdc,
  });

  // all done, return the credential to the owner.
  return newCred;
}
```

We will also create a function for the proof generation process. We will be taking the user and credential data as inputs to this function. Then, we will create an external nullifier for our proof. We will download the proof generation gadgets, and then list down the checks we want to implement like we want to verify that the credential is still valid after 3 days, prove that the credential's 'val' value is between 500 and 5000 etc.
```js
async function proofGenProcess(myCred: credential.Credential, u: user.User) {
  // Now issuer can issue a credential to the user.
  // In this example, we will issue a credential that represents the number of transactions,
  // that the user has made on the Ethereum, at the time of issuance.
  // Assuming that the user has received the credential,
  // user can generate a zk proof to prove that he has sent more than 500 transactions, but no more than 5000.
  // Let's first decide the external nullifier for the proof.
  const externalNullifier = utils.computeExternalNullifier("Galxe Identity Protocol tutorial's verification");
  // Now we need to fetch the proof generation gadgets. It is explicitly fetched outside the proof generation function
  // because usually, the proof generation gadgets are stored in a remote server, and may be large (3-10MB).
  // It's highly recommended to cache the proof generation gadgets locally.
  console.log("downloading proof generation gadgets...");
  const proofGenGagets = await user.User.fetchProofGenGadgetsByTypeID(myCred.header.type, provider);
  console.log("proof generation gadgets are downloaded successfully.");
  // Finally, let's generate the proof.
  // Assume that we want to verify that the credential is still valid after 3 days.
  const expiredAtLowerBound = BigInt(Math.ceil(new Date().getTime() / 1000) + 3 * 24 * 60 * 60);
  // Do not reveal the credential's actual id, which is the evm address in this example
  const equalCheckId = BigInt(0);
  // Instead, claim to be Mr.Deadbeef. It's verifier's responsibility to verify that the pseudonym is who
  // he claims to be, after verifying the proof.
  const pseudonym = BigInt("0xdeadbeef");
  // We want to prove that the credential's 'val' value is between 500 and 5000, inclusively.
  const proof = await u.genBabyzkProofWithQuery(
    u.getIdentityCommitment("evm")!,
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

Next we will create a specific function to verify proofs with zkVerify. We will take the proof and the vk as the inputs for our function. First, we will start a session with zkVerify's Volta Testnet with our seed phrase, then we will call the verify function and pass the proof artifacts to get verified on zkVerify. After the proof is sent for verification, we will wait to listen for ``IncludedInBlock`` and ``Finalized`` events.
```js
async function executeVerificationWithZkVerify(proof: babyzkTypes.WholeProof, vk: unknown) {
  try {
    // Start a new zkVerifySession on our testnet
    const session = await zkVerifySession.start().Volta().withAccount(process.env.ZKVERIFY_SIGNER_PK!);

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
    events.on(ZkVerifyEvents.IncludedInBlock, eventData => {
      console.log("Transaction included in block:", eventData);
    });

    // Listen for the 'finalized' event
    events.on(ZkVerifyEvents.Finalized, eventData => {
      console.log("Transaction finalized:", eventData);
    });

    // Handle errors during the transaction process
    events.on("error", error => {
      console.error("An error occurred during the transaction:", error);
      throw error;
    });

    // Await the final transaction result
    const transactionInfo: VerifyTransactionInfo = await transactionResult;
    console.log("Transaction completed successfully:", transactionInfo);
    return transactionInfo;
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
}
```

Let's create a function to get our proof verification key from the registry. Also we will call the ``executeVerificationWithZkVerify`` function with the proof and vk inside this function.
```js
async function verifyWithZkVerify(proof: babyzkTypes.WholeProof): Promise<boolean> {
  const expectedTypeID = credType.primitiveTypes.scalar.type_id;

  // When using zkVerify on-chain verification, you must first get the verification key.
  // You can embed the verification key in your application, or fetch it from a remote server.
  // We will fetch the verification key from the chain in this example.
  // The first step is to do a proof verification, making sure that the zk proof is valid.
  const tpRegistry = evm.v1.createTypeRegistry({
    signerOrProvider: provider,
  });
  const verifier = await tpRegistry.getVerifier(expectedTypeID, credential.VerificationStackEnum.BabyZK);
  const vKey = await verifier.getVerificationKeysRaw();
  console.log("on zkVerify-chain proof verification start, executing verification transaction");
  const verifyResult = await executeVerificationWithZkVerify(proof, vKey);
  console.log("on zkVerify-chain proof verification result: ", verifyResult);

  return true;
}
```

After creating all the important components of the program let's create our ``main`` function in which we will call all these functions step by step. We will also initialize our user in this function. 

```js
async function main() {
  // prepare must be called by the application before any other function.
  await prepare();

  // The very first step is to create a user with a random identity.
  // This should be done on user's device and the identity should be stored securely.
  const u = new user.User();
  const evmIdSlice = u.createNewIdentitySlice("evm");

  // User's identity commitment is computed based on the secrets of the identity slice.
  // You can also retrive the identity commitment from the identity slice.
  const userIdc = user.User.computeIdentityCommitment(evmIdSlice);

  // let's use a famous Ethereum address in this example.
  const userEvmAddr = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

  // Issuer's process: issuing a credential to the user.
  const myCred = await issuingProcess(userEvmAddr, userIdc);
  console.log("Credential is issued successfully.");
  console.log(myCred.marshal(2));

  // User's process: generating a zk proof to prove some statements about the credential.
  const proof = await proofGenProcess(myCred, u);
  console.log("Proof is generated successfully.", proof);

  // On zkVeirfy chain verification process: verifying the proof.
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

Now you can run this script by running ``node index.js`` and you will get an output in the following structure :- 
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

The code used in this tutorial is available [here](https://github.com/Galxe/identity-protocol/blob/main/apps/tutorial/src/useZkVerify.ts)

Congratulations! You’ve successfully issued a credential, generated a zero-knowledge proof, and verified it with zkVerify. Next steps would be to explore more advanced topics like [Relayer Service](../02-getting-started/05-relayer.md) and [Domain Aggregation](../../architecture/04-proof-aggregation/01-overview.md)