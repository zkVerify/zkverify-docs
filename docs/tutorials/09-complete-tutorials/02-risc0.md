---
title: Risc0
---

## Introduction

This tutorial takes you through the process of building a Risc0 zkVM application.

After building the application, you can run it locally providing different inputs and it will give you back a proof of execution of its code. Then you can submit this proof on zkVerify Mainchain and check it gets correctly verified and included in a block.

Check out [this section](https://dev.risczero.com/api/zkvm/) of Risc0 documentation for additional information on what a zkVM application is.

## Prerequisites

- Risc0 installation requirements: check out [these steps](https://dev.risczero.com/api/zkvm/install#prerequisites).
- Risc0 installation: check out [these steps](https://dev.risczero.com/api/zkvm/install#install).
- Machine requirements: 16 GB RAM.

:::tip[**Toolchain version**]

Note this tutorial is based on version `1.2.1` of Risc0 toolchain. Very likely you should be able to follow it using a more recent version, but in case you encounter any issue you can explicitly target that version with command `rzup --version 1.2.1`.

:::

## Building the application

In this tutorial you will build an application which receives a string as input, performs its sha256 hashing and returns back the hash as output. Leveraging the zero knowledge feature of Risc0 zkVM, you are able to show that you know some input that hashes to that specific output without actually showing the input. This use case can be significant for example when proving ownership of confidential data, like a password or a private key.

:::tip[**Don't get confused with terminology!**]

Make sure not to make confusion between *application inputs* and *verification public inputs*. When you run the application it is supposed you are in a private environment, you provide it with whatever application inputs you want and you have to keep them private; after the run, you get back the proof of execution and the outputs of the execution. The outputs can be safely shared with other parties, indeed they become the public inputs of the verification phase (performed by other parties).

:::

In order to build the application, go through the following steps:

- Initialize a new Risc0 project typing within a terminal:

  ```bash
  cargo risczero new hasher --guest-name hasher_guest
  cd hasher
  ```

  This will be your working directory.

- Modify the host program (just consider it as the code that is running the zkVM):
  - Open the file `hasher/host/Cargo.toml` with a text editor and add at the bottom the following lines:

    ```rust
    serde_json = "1.0.137"
    ciborium = "0.2.2"
    hex = "0.4.3"
    ```

  - Open the file `hasher/host/src/main.rs` and replace the lines:

    ```rust
    // For example:
    let input: u32 = 15 * u32::pow(2, 27) + 1;
    ```

    with the following code:

    ```rust
    let input: String = std::env::args().nth(1).unwrap();
    println!("Input argument is: {}", input);
    ```

    and the lines:

    ```rust
    // TODO: Implement code for retrieving receipt journal here.
    // For example:
    let _output: u32 = receipt.journal.decode().unwrap();
    ```

    with the following code:

    ```rust
    let mut bin_receipt = Vec::new();
    ciborium::into_writer(&receipt, &mut bin_receipt).unwrap();
    let out = std::fs::File::create("proof.bin").unwrap();
    ciborium::into_writer(&receipt, out).unwrap();

    println!(
        "Serialized bytes array (hex) INNER: {}\n",
        hex::encode(&bin_receipt)
    );
    let receipt_journal_bytes_array = &receipt.journal.bytes.as_slice();
    println!(
        "Journal bytes array (hex): {}\n",
        hex::encode(&receipt_journal_bytes_array)
    );
    let image_id_hex = hex::encode(
        HASHER_GUEST_ID
            .into_iter()
            .flat_map(|v| v.to_le_bytes().into_iter())
            .collect::<Vec<_>>(),
    );
    println!("Serialized bytes array (hex) IMAGE_ID: {}\n", image_id_hex);
    let output: String = receipt.journal.decode().unwrap();
    println!("Output is: {}", output);
    ```

  In this way you have prepared the host to easily receive command-line argument and to save the proof binary data in `proof.bin`, print out also to the terminal the proof (`bin_receipt`), the outputs (`receipt_journal_bytes_array`) and the image id (`image_id_hex`); these will be useful in a later step when you need to submit them on the zkVerify Mainchain.

- Modify the guest program (just consider it as the code whose execution you want to prove and you want other to verify):
  - Open the file `hasher/methods/guest/Cargo.toml` with a text editor and add at the bottom the following line:

    ```rust
    sha2 = "0.10"
    ```

  - Open the file `hasher/methods/guest/src/main.rs` with a text editor and overwrite its content with the following code:

    ```rust
    use risc0_zkvm::guest::env;
    use sha2::{Digest, Sha256};

    fn main() {
        // read the input
        let input: String = env::read();

        let mut hasher = Sha256::new();
        hasher.update(input.as_bytes()); // Update the hasher with the input bytes
        let result = hasher.finalize(); // Get the hash digest
        let output = format!("{:x}", result); // Convert the hash digest to a hexadecimal string
        
        // write public output to the journal
        env::commit(&output);
    }
    ```

  Just a brief description of the above code: the program input is read, the computation is performed (hashing) and the output is written back.

- From a terminal located at your working directory, build the project with:

  ```bash
  cargo build --release
  ```

## Running the application

You are now ready to run your application!

Open a terminal located at your working directory and type the command:

```bash
RISC0_DEV_MODE=0 cargo run --release -- "zkVerify is da best!"
```

Replacing `zkVerify is da best!` with your desired input.

In summary, the above command will:

- Start a Risc0 zkVM using the modified host program.
- Read the application input your provided as command line argument (`zkVerify is da best!` in this case).
- Perform an execution of the guest program and generate a proof of its execution.
- Print to the terminal the serialized proof and the serialized output.
- Perform an optional verification using the proof and the output (using them as verification public input) for double check.

Finally you need to save the following items:

- The serialized proof (`receipt_inner_bytes_array` string or the `proof.bin` file).
- The serialized outputs (`receipt_journal_bytes_array`).
- The guest program fingerprint, known as image id (`image_id_hex`).

They will be used respectively as proof, public inputs and verification key during the verification phase.

Now that you have learned how to set up and run your Risc0 zkVM application you can play a bit with the guest program code and modify the execution logic.

The next step is now submitting the proof to zkVerify:
- Via [PolkadotJS](../05-submit-proofs/04-risc0_proof_submission.md)
- Via [zkVerifyJS](../05-submit-proofs/01-typescript-example.md)
