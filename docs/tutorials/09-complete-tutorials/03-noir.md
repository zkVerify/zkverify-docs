---
title: Noir
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

Now run the following commands to convert the generated files to required hex formats:
```bash
# noir-cli proof-data -n <num_public_inputs> --input-proof <bb_proof path> --output-proof <zkv_proof path> --output-pubs <zkv_pubs path>
noir-cli proof-data -n 1 --input-proof ./target/proof --output-proof proof.hex --output-pubs pub.hex

# noir-cli key --input <bb_vk path> --output <zkv_vk path>
noir-cli key --input ./target/vk --output vk.hex
```

After running all these commands, you would have generated three files namely proof.hex, pub.hex and vk.hex. We will be using all these files while submitting proof for verification. We will be using ```zkverify JS``` package to verify our proofs with zkVerify and will check on-chain through the proof receipts.

You can use [zkVerifyJS](../05-submit-proofs/01-typescript-example.md) to submit the proof to zkVerify. After getting proof receipts from our testnet, you can verify it onchain by calling the zkVerify contract. Checkout this [tutorial](./05-smart-contract.md) to verify proof receipts onchain.
