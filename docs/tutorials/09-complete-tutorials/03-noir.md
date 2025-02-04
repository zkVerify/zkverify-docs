---
title: Verifying Noir proofs on zkVerify
---

In this tutorial, we will use the quickstart Noir Lang guide to generate an UltraPlonk proof and will verify it on zkVerify. We will not be going in detail about Noir implementation, our focus would be on verifying those proofs efficiently on zkVerify.

## Steps Involved
- Installing Noir using noirup, and also installing bb(Barretenberg's Backend) using bbup 
- Generating Noir UltraPlonk proofs
- Converting the proof and vk to required hex format using Noir-CLI
- Verifying our proofs on zkVerify and getting proof receipts
- Verifying the proof receipts on Ethereum

To start this tutorial, first we need to install the Noir toolkit using noirup tool. Also, to generate the proofs we need to install Barretenberg's Backend used by Noir Toolkit. Run the following commands to install the requirements :

1. Install noirup by running the following command:
```bash
curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash
```

2. Running noirup will install the latest version of Noir Toolkit
```bash
noirup
```

3. Install bbup by running the following command:
```bash
curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/refs/heads/master/barretenberg/bbup/install | bash
```

4. Install BaBarretenberg's Backend by running bbup command:
```bash
bbup
```

5. Create hello_world noir project using the following command:
```bash
nargo new hello_world
```

After implementing all the commands given above, you would have created the hello-world example Noir project. To learn more about this project you can check out [Noir docs](https://noir-lang.org/docs/getting_started/quick_start). Now we will generate proofs using the Noir toolkit for our hellow_world project.

To generate proofs, first we need to create a ``` Prover.Toml``` file, which will hold our inputs for the hello_world noir circuit. Populate the ```Prover.Toml``` file with the inputs given below :
```toml
x = "1"
y = "2"
```

Let's execute our hello_world circuit and get our witness value, which will be used to generate proofs and vk. Use the following command to execute:
```bash
nargo execute
```

Once we have generated our witness, we can generate proof and vk using bb toolkit. Use the follwing command to generate the required files:
```bash
# To generate proof
bb prove -b ./target/hello_world.json -w ./target/hello_world.gz -o ./target/proof

# To generate vk
bb write_vk -b ./target/hello_world.json -o ./target/vk

```

Now, we have sucessfully created our required proof and vk files. Now we will use zkVerify's ```noir-cli``` tool to convert these files to required hex formats. Let's start by downloading our ```noir-cli``` toolkit by cloning our github repository.
```bash
git clone https://github.com/zkVerify/ultraplonk_verifier.git
```

After downloading, we need to build the toolkit so make sure you have rust installed. To build the toolkit run the following command:
```bash
cargo install --features bins --path .
```

Now run the follwing commands to convert the generated files to required hex formats:
```bash
# noir-cli proof-data -n <num_public_inputs> --input-proof <bb_proof path> --output-proof <zkv_proof path> --output-pubs <zkv_pubs path>
noir-cli proof-data -n 1 --input-proof ./target/proof --output-proof proof.hex --output-pubs pub.hex

# noir-cli key --input <bb_vk path> --output <zkv_vk path>
noir-cli key --input ./target/vk --output vk.hex
```

After running all these commands, you would have generated three files namely proof.hex, pub.hex and vk.hex. We will be using all these files while submitting proof for verification using zkVerifyJS. We will be using [zkVerifyJS](https://docs.zkverify.io/tutorials/submit-proofs/typescript-example) which is a NPM module which makes it very easy to submit proofs, listen events and get attestation proofs. Create a new folder, instantiate a NPM package and install zkVerifyJS. Use the following commands :- 

- mkdir proof-submission
- cd proof-submission
- npm init
- npm i zkverifyjs

We need to import ```zkVerifySession``` and ```ZkVerifyEvents``` from zkVerifyJs along with the proofs we generated.

```js
const {zkVerifySession, Library, CurveType, ZkVerifyEvents} = require("zkverifyjs");
const fs = require("fs");
```

Before moving forward, let's import all the files we generated from ```noir-cli```, 
```js
let proof = fs.readFileSync("../hello_world/proof.hex").toString()
let vk = fs.readFileSync("../hello_world/vk.hex").toString()
let public = fs.readFileSync("../hello_world/pub.hex").toString()
```

To start the verification process, we will start by instantiating a session with our testnet with an account(This account should have $ACME to pay for transactions). 
```js
    const session = await zkVerifySession.start().Testnet().withAccount("seed-phrase")
```

Before submitting the proof for verification, we need to register our verification key we got from ```noir-cli```. We can register our key using zkVerifyJS itself with the code snippet given below and it will also save your vkey hash to vkey.json file which we can use during proof verification. 

```js
let vk = fs.readFileSync("../hello_world/vk.hex").toString()

const {events, regResult} = await session.registerVerificationKey().ultraplonk().execute(vk.split("\n")[0]);

events.on(ZkVerifyEvents.Finalized, (eventData) => {
    console.log('Verification finalized:', eventData);
    fs.writeFileSync("vkey.json", JSON.stringify({"hash": eventData.statementHash}, null, 2));
    return eventData.statementHash
});

```

Next we will send a proof verification request to the testnet, with all the details like which proving schema, proof, public signals and the key. We will also add a condition to wait till attestation is published. 

```js
const vkey = require("./vkey.json")
const {events, txResults} = await session.verify().ultraplonk().waitForPublishedAttestation().withRegisteredVk().execute({proofData:{
        proof: proof.split("\n")[0],
        vk: vkey.hash,
        publicSignals: public.split("\n").slice(0,-1),
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

![alt_text](./img/noir-tutorial-explorer.png)

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

After this, we are ready to create our main contract which will check attestations and can perform any function as per the business logic. To get started first we declare our proving system which is UltraPlonk, this will be used while generating the leaf digest to verify the attestations.

```solidity
bytes32 public constant PROVING_SYSTEM_ID = keccak256(abi.encodePacked("ultraplonk"));
```

We also need to store the address of zkVerifier contract, and vkey hash we got while registering the vk with zkVerify. We will initialize both these values with the constructor.

```solidity
// zkVerify contract
    address public zkVerify;

    // vkey for our circuit
    bytes32 public vkey;

    constructor(address _zkVerify, bytes32 _vkey) {
        zkVerify = _zkVerify;
        vkey = _vkey;
    }
```

Now we can move to the verification part, where can call the zkVerify’s contract to check if the attestations are really correct. We need to get the following to verify the proof :- 

- Attestation ID
- Public Inputs
- Merkle Proof
- Number of Leaves
- Leaf Index

We can get all the above data except the public inputs from the attestation.json file, we have generated earlier. User can provide the public inputs to the verify function which we can use to create the leaf digest. We need to pass the public inputs hash we got while generating proof(You can find this in proof.json file). To create the final leaf we need the hash of proving system, vkey, and the combined hash of public inputs.

```solidity
bytes32 leaf = keccak256(abi.encodePacked(PROVING_SYSTEM_ID, vkey, keccak256(abi.encodePacked(_input))));
```

After generating the leaf digest, we can call the zkVerify contracts to verify our attestation proof and for this we will use the interface that we created earlier.

```solidity
    function checkHash(
        bytes32 _hash,
        uint256 _attestationId,
        bytes32[] calldata _merklePath,
        uint256 _leafCount,
        uint256 _index
    ) public {

        bytes32 leaf = keccak256(abi.encodePacked(PROVING_SYSTEM_ID, vkey, keccak256(abi.encodePacked(_hash))));

        require(IZkVerifyAttestation(zkVerify).verifyProofAttestation(
            _attestationId,
            leaf,
            _merklePath,
            _leafCount,
            _index
        ), "Invalid proof");
    }
```

