---
title: Groth16 Proof Submission
---

In this tutorial we'll go through the process of submitting and verifying a Groth16 proof to the zkVerify chain.

## Requirements

- A Substrate compatible wallet with funds (ACME) connected to the network.
- NodeJS and npm installed on your system.

## Step 1: Proof generation with snarkJS

Follow this [this snarkJS guide](https://github.com/iden3/snarkjs?tab=readme-ov-file#guide) to generate a Groth16 proof, along with the corresponding verification key, and public inputs. The tutorial works with any Groth16 proof generated with snarkJs, as long as its number of public inputs does not exceed 16. Both bn128 and bls12381 curves are supported. So, if you already happen to have a snarkJS Groth16 proof at hand, then you can skip this step.

In any, case, at the end of this step you should have three json files `proof.json`, `verification_key.json`, and `public.json` (their actual names are not important).

## Step 2: Conversion to zkVerify format

zkVerify chain accepts a slightly different format than snarkJS output. So we will use the command line utility [`snarkjs2zkv`](https://github.com/HorizenLabs/snarkjs2zkv) to perform the necessary conversions.

1. Download `snarkjs2zkv`:

    ```sh
    git clone https://github.com/HorizenLabs/snarkjs2zkv.git
    ```

2. Change directory:

    ```sh
    cd snarkjs2zkv
    ```

3. Install `snarkjs2zkv` locally:

    ```sh
    npm install
    ```

4. Convert the proof (be sure to substitute `<path_to_proof.json>` with the actual path of your snarkJS json proof file):

    ```sh
    node snarkjs2zkv convert-proof <path_to_proof.json> -o proof_zkv.json
    ```

5. Convert the verification key (be sure to substitute `<path_to_verification_key.json>` with the actual path of your snarkJS json verification key file):

    ```sh
    node snarkjs2zkv convert-vk <path_to_verification_key.json> -o verification_key_zkv.json
    ```

6. Convert the public input.

    If the proof uses the bn128 curve, then use the following command:

    ```sh
    node snarkjs2zkv convert-public <path_to_public.json> -o public_zkv.json -c bn128
    ```

    Otherwise, if the proof uses the bls12381 curve, use the following command:

    ```sh
    node snarkjs2zkv convert-public <path_to_public.json> -o public_zkv.json -c bls12381
    ```

At the end of this step you should have the three files `proof_zkv.json`, `verification_key.json`, and `public_zkv.json`.

## Step 3: Sending the proof to zkVerify for verification

1. Head to [polkadot.js.org frontend](https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Ftestnet-rpc.zkverify.io#/extrinsics)
2. Select your account (you must have some ACME).
3. Choose the `settlementGroth16Pallet`, and the `submitProof` extrinsic.
4. Inside the field `vkOrHash` select `Vk`
5. Fill in all the required fields by copy-pasting them from the json files obtained in the previous step. All the fields should be pasted without quotes. For the `gammaAbcG1` field and the `input` field you may need to click on the `Add Item` button a certain number of times, depending on the number of corresponding entries in your json files.
6. Click on the `submitTransaction` button.

## Step 4

Check your transaction on the [zkVerify Block Explorer](https://testnet-explorer.zkverify.io/v0)!
