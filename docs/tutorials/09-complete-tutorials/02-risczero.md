---
title: RiscZero
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

Once we have generated our proof artifacts, we are ready to submit our proofs for verification to zkVerify. We will be using ```zkverify JS``` package to verify our proofs with zkVerify and will check on-chain through the proof receipts.

You can check this [tutorial](./04-zkVerifyjs.md) to verify proofs with zkVerifyJS. After getting proof receipts from our testnet, you can verify it onchain by calling the zkVerify contract. Checkout this [tutorial](./05-smart-contract.md) to verify proof receipts onchain.