---
title: Verifying Circom proofs on zkVerify
---

In this tutorial, we will be implementing a simple hash verification circuit with Circom and will use zkVerify to verify these proofs. The circuit we will be building is very simple where it takes a private input and a public input and just checks if the public input is the same as the Poseidon hash of the private input. 

## Steps Involved
- Creating the required circom circuit, downloading the artifacts and generating a proof
- Registering our verification key with zkVerify
- Verifying our zk proof and getting proof receipts
- Verifying the proof receipts on Ethereum

To start this tutorial, we will create our circuits using [zkRepl](https://zkrepl.dev/), which is very beginner-friendly. We won’t be diving deep into Circom DSL, but we will explore all the required code snippets.
As explained earlier, we will be having two inputs for our zk circuit in which one will be public and one will be private. And we will be using Poseidon Hash as our hash function in our circuit. To implement Poseidon Hash, we need to import corresponding libraries from circomlib.

Here’s the snippet of the implemented circuit :- 

```circom
pragma circom 2.1.6;


include "circomlib/poseidon.circom";
template Example () {

   // Getting the inputs needed for our circuit
   signal input a; // Actual Message
   signal input b; // Poseidon hash of the message
  
   component hash = Poseidon(1); // Creating our Poseidon component with one input
   hash.inputs[0] <== a;
   log(hash.out);
   assert(b == hash.out); // Checking if the input hash is same as calculated hash
}
component main { public [ b ] } = Example();
```

Over in zkRepl, we can generate our circuit artifacts as well which will be used to generate proofs for our circuit. We also need to pass our initial set of inputs to compile the circuits and generate the arctifacts. To do this, after the circuit we have a separate input code commented out, just change is as per our circuit.

```circom
/* INPUT = {
   "a": "5",
   "b": "19065150524771031435284970883882288895168425523179566388456001105768498065277"
} */
```

Then compile this circuit with zkRepl and get the required arctifacts. Next to generate proofs, click on the groth16 option given on the results tab. This will generate the required snarkjs embeddings to generate a zk proof for given inputs. Click on the main.groth16.html option to download the proof generator using which we can generate our groth16 proofs. Once downloaded, open it with any browser.

![alt_text](./img/circom-tutorial-zkRepl.png)

Specify your inputs and generate proof on this page. Then save the proof in proof.json file and public signals in public.json file. These files will be helpful while submitting our proofs for verification using zkVerify. Also, make sure to download main.groth16.vkey.json from zkRepl as well. 

![alt_text](./img/circom-tutorial-proof-generate.png)

Once we have all these files ready, we are ready to submit our proofs for verification to zkVerify. To do so, we will be using [zkVerifyJS](https://docs.zkverify.io/tutorials/submit-proofs/typescript-example) which is a NPM module which makes it very easy to submit proofs, listen events and get attestation proofs. Create a new folder, instantiate a NPM package and install zkVerifyJS. Use the following commands :- 

- mkdir proof-submission
- cd proof-submission
- npm init
- npm i zkverifyjs

We will need to import all our previously saved files(proof.json, public.json and main.groth16.vkey.json) to submit that proof for verification. 

```js
const proof = require("./data/proof.json");
const public = require("./data/public.json");
const key = require("./data/main.groth16.vkey.json");
```

Once you have all the requirements installed, we will start by instantiating a session with our testnet with an account(This account should have $ACME to pay for transactions). 
```js
    const session = await zkVerifySession.start().Testnet().withAccount("seed-phrase")
```

Before submitting the proof for verification, we need to register our verification key we downloaded from zkRepl. We can register our key using zkVerifyJS itself with the code snippet given below and it will also save your vkey hash to vkey.json file which we can use during proof verification. 

```js
const {events, regResult} = await session.registerVerificationKey().groth16(Library.snarkjs, CurveType.bn128).execute(key);

    events.on(ZkVerifyEvents.Finalized, (eventData) => {
        console.log('Registration finalized:', eventData);
        fs.writeFileSync("vkey.json", JSON.stringify({"hash": eventData.statementHash}, null, 2));
        return eventData.statementHash
    });

```

 Next we will send a proof verification request to the testnet, with all the details like which proving schema, proof, public signals and the key. We will also add a condition to wait till attestation is published. As we have already registered our vkey with zkVerify, we can import it and use it for our proof verification :- 

```js
const vkey = require("./vkey.json")
```

```js
const {events, txResults} = await session.verify()
        .groth16(Library.snarkjs, CurveType.bn128).waitForPublishedAttestation().withRegisteredVk()
        .execute({proofData: {
            vk: vkey.hash,
            proof: proof,
            publicSignals: public
        }});
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

![alt_text](./img/circom-tutorial-explorer.png)

To proceed further, we would require attestation proofs which can be verified onchain on Ethereum that the proof was verified by zkVerify, these proofs can only be generated once the proofs attestation is published on Ethereum. To get the proof we implement :- 

```js
events.on(ZkVerifyEvents.AttestationConfirmed, async(eventData) => {
        console.log('Attestation Confirmed', eventData);
        const proofDetails = await session.poe(attestationId, leafDigest);
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

After this, we are ready to create our main contract which will check attestations and can perform any function as per the business logic. To get started first we declare our proving system which is groth16, this will be used while generating the leaf digest to verify the attestations.

```solidity
bytes32 public constant PROVING_SYSTEM_ID = keccak256(abi.encodePacked("groth16"));
```

We also need to store the address of zkVerifier contract and vkey hash we got after registering our verification key. We will initialize both these values with the constructor.

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

There are certain things we need to consider before moving forward, as all the public inputs in a circom circuit are field elements which can be considered as uint256 in Solidity’s context. But zkVerify’s verifier pallets uses big endian encoding but EVM uses little endian encoding, so we need a helper function to convert it. This is only needed for groth16 proofs. To make it easier, we have provided the required code snippet below :- 

```solidity
function _changeEndianess(uint256 input) internal pure returns (uint256 v) {
        v = input;
        // swap bytes
        v =
            ((v &
                0xFF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00) >>
                8) |
            ((v &
                0x00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF) <<
                8);
        // swap 2-byte long pairs
        v =
            ((v &
                0xFFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000) >>
                16) |
            ((v &
                0x0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF) <<
                16);
        // swap 4-byte long pairs
        v =
            ((v &
                0xFFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000) >>
                32) |
            ((v &
                0x00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF) <<
                32);
        // swap 8-byte long pairs
        v =
            ((v &
                0xFFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF0000000000000000) >>
                64) |
            ((v &
                0x0000000000000000FFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF) <<
                64);
        // swap 16-byte long pairs
        v = (v >> 128) | (v << 128);
    }
```

Now we can move to the verification part, where can call the zkVerify’s contract to check if the attestations are really correct. We need to get the following to verify the proof :- 

- Attestation ID
- Public Inputs
- Merkle Proof
- Number of Leaves
- Leaf Index

We can get all the above data except the public inputs from the attestation.json file, we have generated earlier. User can provide the public inputs to the verify function which we can use to create the leaf digest. For all the inputs, we first need to change their endianess, encode all the public inputs together and then hash it using keccak256. To create the final leaf we need the hash of proving system, vkey and the combined hash of public inputs.

```solidity
bytes32 leaf = keccak256(abi.encodePacked(PROVING_SYSTEM_ID, vkey, keccak256(abi.encodePacked(_changeEndianess(_hash)))));
```

After generating the leaf digest, we can call the zkVerify contracts to verify our attestation proof and for this we will use the interface that we created earlier.

```solidity
function checkHash(
        uint256 _hash,
        uint256 _attestationId,
        bytes32[] calldata _merklePath,
        uint256 _leafCount,
        uint256 _index
    ) public {

        bytes32 leaf = keccak256(abi.encodePacked(PROVING_SYSTEM_ID, vkey, keccak256(abi.encodePacked(_changeEndianess(_hash)))));

        require(IZkVerifyAttestation(zkVerify).verifyProofAttestation(
            _attestationId,
            leaf,
            _merklePath,
            _leafCount,
            _index
        ), "Invalid proof");
    }

```