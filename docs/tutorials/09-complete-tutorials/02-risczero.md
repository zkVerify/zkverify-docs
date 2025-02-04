---
title: Verifying RiscZero proofs on zkVerify
---

In this tutorial, we will use the quickstart RiscZero guide to generate a proof and will verify the proofs on zkVerify. We will not be going in detail about RiscZero implementation, our focus would be on verifying those proofs.

## Steps Involved
- Installing RiscZero using rzup, and creating an example application
- Generating RiscZero proofs
- Verifying our proofs on zkVerify and getting proof receipts
- Verifying the proof receipts on Ethereum

To start this tutorial, first we need to install the RiscZero cargo toolchain using rzup tool. Use the following command to install rzup and RiscZero toolchain.

1. Install rzup by running the following command:
```bash
curl -L https://risczero.com/install | bash
```

2. Running rzup will install the latest version of the RISC Zero toolchain:
```bash
rzup install
```

3. Create a new hello_world project
```bash
cargo risczero new my_project --guest-name guest_code_for_zk_proof
```

After implementing all the commands given above, you would have created the hello-world example RiscZero project. To learn more about this project you can check out [RiscZero docs](https://dev.risczero.com/api/zkvm/tutorials/hello-world). Next, we will edit the host codebase to generate proofs and store it in proof.json which we will use later to verify proofs.

You can open your example project using any IDE and navigate to my_project/host/src/main.rs file. This file contains the logic to generate the proof for our zkApp. We need to add few lines to this file to store our generated proofs. 

We will add few dependencies to host machine, locate to my_project/host/cargo.toml file and under the dependencies add the following :- 
```toml
serde = "1.0"
serde_json = "1.0.137"
ciborium = "0.2.2"
hex = "0.4.3"
```
Next we will update our main.rs file. We will create a struct named ProofOutput which will contains the required proof details we need to verify our proofs on zkVerify. Also, we will use the Serialize and Deserialize macros, to be able to convert this into required json format.
```rust
#[derive(Serialize, Deserialize)]
pub struct ProofOutput{
    pub proof: String,
    pub pub_inputs: String,
    pub image_id: String,
}
```

We need to get our required proof data from receipts generated during proof generation. In main.rs file search for :
```rust
receipt
        .verify(GUEST_CODE_FOR_ZK_PROOF_ID)
        .unwrap();
```
Now we will add the logic to construct the proof, public inputs and vk from the receipt generated. Add the following code after this line:
```rust
let mut bin_receipt = Vec::new();
    ciborium::into_writer(&receipt, &mut bin_receipt).unwrap();
    let proof = hex::encode(&bin_receipt);

    fs::write("proof.txt", hex::encode(&bin_receipt)).unwrap();
    let receipt_journal_bytes_array = &receipt.journal.bytes.as_slice();
    let pub_inputs = hex::encode(&receipt_journal_bytes_array);
    
    let image_id_hex = hex::encode(
        GUEST_CODE_FOR_ZK_PROOF_ID
            .into_iter()
            .flat_map(|v| v.to_le_bytes().into_iter())
            .collect::<Vec<_>>(),
    );
    
    let proof_output = ProofOutput{
        proof: "0x".to_owned()+&proof,
        pub_inputs: "0x".to_owned()+&pub_inputs,
        image_id: "0x".to_owned()+&image_id_hex,
    };

    let proof_output_json = serde_json::to_string(&proof_output).unwrap();
    fs::write("proof.json", proof_output_json).unwrap();
```

Now we are ready to generate our RiscZero proofs. Just run the following command in the parent project directory to generate proof :
```bash
RISC0_DEV_MODE=0 cargo run --release
```

Once we have generated our proof, we are ready to submit our proofs for verification to zkVerify. To do so, we will be using [zkVerifyJS](https://docs.zkverify.io/tutorials/submit-proofs/typescript-example) which is a NPM module which makes it very easy to submit proofs, listen events and get attestation proofs. Create a new folder, instantiate a NPM package and install zkVerifyJS. Use the following commands :- 

- mkdir proof-submission
- cd proof-submission
- npm init
- npm i zkverifyjs

We need to import ```zkVerifySession``` and ```ZkVerifyEvents``` from zkVerifyJs along with the proofs we generated.

```js
const {zkVerifySession, Library, CurveType, ZkVerifyEvents} = require("zkverifyjs");
const proof = require("../my_project/proof.json");
const fs = require("fs");
```

To start the verification process, we will start by instantiating a session with our testnet with an account(This account should have $ACME to pay for transactions). 
```js
    const session = await zkVerifySession.start().Testnet().withAccount("seed-phrase")
```

Next we will send a proof verification request to the testnet, with all the details like which proving schema, proof, public signals and the key. We will also add a condition to wait till attestation is published. 

```js
const {events, txResults} = await session.verify().risc0().waitForPublishedAttestation()
        .execute({proofData:{
            proof: proof.proof,
            vk: proof.image_id,
            publicSignals: proof.pub_inputs,
            version: "V1_2" // Mention the R0 version
        }})
```

We can listen to events to get the current status of our submitted proof, we have various options like if proof is included in block, proof is finalized or attestations for the proof have been published. You can listen to them using our events.on() function like :- 
```js
  events.on(ZkVerifyEvents.IncludedInBlock, (eventData) => {
    console.log('Transaction included in block:', eventData);
  });

  events.on(ZkVerifyEvents.Finalized, (eventData) => {
    console.log('Transaction finalized:', eventData);
  });
```

Using the txHash after the proof is included in the block, you can check it out in our explorer.

![alt_text](./img/r0-tutorial-explorer.png)

To proceed further, we would require attestation proofs which can be verified onchain on Ethereum that the proof was verified by zkVerify, these proofs can only be generated once the proofs attestation is published on Ethereum. To get the proof we implement :- 

```js
events.on(ZkVerifyEvents.AttestationConfirmed, async(eventData) => {
        console.log('Attestation Confirmed', eventData);
        const proofDetails = await session.poe(attestationId, leafDigest);
        proofDetails.attestationId = eventData.id;
        fs.writeFileSync("attestation.json", JSON.stringify(proofDetails, null, 2));
        console.log("proofDetails", proofDetails);
    })
```

By running the above code snippet, your attestation proof will be saved at attestation.json file. After completing this process, we have successfully verified our proof with zkVerify and the next steps will be to use this attestation proof for our business logic onchain. We will be developing a smart contract which verifies the attestation proof by calling the zkVerify contract. We will be using Remix toolkit to develop the smart contract which will have the interface to verify our attestations. Also we have a [foundry template](https://github.com/zkVerify/zkverify-evm-dapp-example) you can check out.

Before moving to the main logic, you can just copy paste the below code to create an interface to zkVerify contract. Create a new file called as IZKVerify.sol and paste the following :- 

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

interface IZkVerifyAttestation {

    function submitAttestation(
        uint256 _attestationId,
        bytes32 _proofsAttestation) external;

    function submitAttestationBatch(
        uint256[] calldata _attestationIds,
        bytes32[] calldata _proofsAttestation) external;

    function verifyProofAttestation(
        uint256 _attestationId,
        bytes32 _leaf,
        bytes32[] calldata _merklePath,
        uint256 _leafCount,
        uint256 _index) external returns (bool);
}
```

After this, we are ready to create our main contract which will check attestations and can perform any function as per the business logic. To get started first we declare our proving system which is RiscZero, this will be used while generating the leaf digest to verify the attestations.

```solidity
bytes32 public constant PROVING_SYSTEM_ID = keccak256(abi.encodePacked("risc0"));
```

We also need to store the address of zkVerifier contract, vkey hash, and the version hash we got while generating the proof. We will initialize both these values with the constructor.

```solidity
// zkVerify contract
    address public zkVerify;

    // vkey for our circuit
    bytes32 public vkey;

    // version hash
    bytes32 public vhash;

    constructor(address _zkVerify, bytes32 _vkey, bytes32 _vhash) {
        zkVerify = _zkVerify;
        vkey = _vkey;
        vhash = _vhash;
    }
```

Now we can move to the verification part, where can call the zkVerify’s contract to check if the attestations are really correct. We need to get the following to verify the proof :- 

- Attestation ID
- Public Inputs
- Merkle Proof
- Number of Leaves
- Leaf Index

We can get all the above data except the public inputs from the attestation.json file, we have generated earlier. User can provide the public inputs to the verify function which we can use to create the leaf digest. We need to pass the public inputs hash we got while generating proof(You can find this in proof.json file). To create the final leaf we need the hash of proving system, vkey, version hash and the combined hash of public inputs.

```bash
roof::V1_0: sha256("risc0:v1.0")="0xdf801e3397d2a8fbb77c2fa30c7f7806ee8a60de44cb536108e7ef272618e2da"
Proof::V1_1: sha256("risc0:v1.1")="0x2a06d398245e645477a795d1b707344669459840d154e17fde4df2b40eea5558"
Proof::V1_2: sha256("risc0:v1.2")="0x5f39e7751602fc8dbc1055078b61e2704565e3271312744119505ab26605a942"
```

```solidity
bytes32 leaf = keccak256(abi.encodePacked(PROVING_SYSTEM_ID, vkey, version_hash, keccak256(abi.encodePacked(_hash))));
```

After generating the leaf digest, we can call the zkVerify contracts to verify our attestation proof and for this we will use the interface that we created earlier.

```solidity
function checkHash(
        bytes memory _hash,
        uint256 _attestationId,
        bytes32[] calldata _merklePath,
        uint256 _leafCount,
        uint256 _index
    ) public {

        bytes32 leaf = keccak256(abi.encodePacked(PROVING_SYSTEM_ID, vkey, vhash, keccak256(abi.encodePacked(_hash))));

        require(IZkVerifyAttestation(zkVerify).verifyProofAttestation(
            _attestationId,
            leaf,
            _merklePath,
            _leafCount,
            _index
        ), "Invalid proof");
    }
```