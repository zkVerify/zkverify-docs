---
title: Generating Proofs
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

This guide will walk you through the process of generating compatible proofs which can be verified using [zkVerify](https://zkverify.io/). You can navigate through all the supported proof types using the tabs below.

<Tabs groupId="generate">

<TabItem value="groth16" label="Groth16">
We will be implementing a simple hash verification circuit with Circom and will use zkVerify to verify these proofs. The circuit we will be building is very simple where it takes a private input and a public input and just checks if the public input is the same as the Poseidon hash of the private input. 

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

![alt_text](img/circom-tutorial-zkrepl.png)

Specify your inputs and generate proof on this page. Then save the proof in proof.json file and public signals in public.json file. These files will be helpful while submitting our proofs for verification using zkVerify. Also, make sure to download main.groth16.vkey.json from zkRepl as well. 

![alt_text](img/circom-tutorial-proof-generate.png)
</TabItem>

<TabItem value="ultrahonk" label="Ultrahonk">
We will use the quickstart Noir Lang guide to generate an UltraHonk proof and will verify it on zkVerify. We will not be going in detail about Noir implementation, our focus would be on verifying those proofs efficiently on zkVerify.

## Steps Involved
- Installing Noir using noirup, and also installing bb (Barretenberg's Backend) using bbup 
- Generating Noir UltraHonk proofs
- Converting the proof, vk, and public inputs to required hex format using Bash
- Verifying our proofs on zkVerify and getting proof receipts
- Verifying the proof receipts on Ethereum

To start this tutorial, first we need to install the Noir toolkit using noirup tool. Also, to generate the proofs we need to install Barretenberg's Backend used by Noir Toolkit. Run the following commands to install the requirements:

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

4. Install Barretenberg's Backend by running bbup command:
```bash
bbup -v <version>
```

5. Create hello_world noir project using the following command:
```bash
nargo new hello_world
```

After implementing all the commands given above, you would have created the hello-world example Noir project. To learn more about this project you can check out [Noir docs](https://noir-lang.org/docs/getting_started/quick_start). Now we will generate proofs using the Noir toolkit for our hello_world project.

To generate proofs, first we need to create a `Prover.toml` file, which will hold our inputs for the hello_world noir circuit. Populate the `Prover.toml` file with the inputs given below :
```toml
x = "1"
y = "2"
```

Let's execute our hello_world circuit and get our witness value, which will be used to generate proofs and vk. Use the following command to execute:
```bash
nargo execute
```

Once we have generated our witness, we can generate proof and vk using the bb toolkit. Use the following command to generate the required files:
```bash
# To generate proof
bb prove -s ultra_honk -b ./target/hello_world.json -w ./target/hello_world.gz -o ./target/proof --oracle_hash keccak --zk

# To generate vk
bb write_vk -s ultra_honk -b ./target/hello_world.json -o ./target/vk --oracle_hash keccak

```

After running these commands, you will have three files, namely: `proof`, `public_inputs`, and `vk` inside the `target` folder which will be used for verification.

To convert the three files into hex format, run the following Bash commands:
```bash
# Convert proof to hexadecimal format
{ printf "0x"; xxd -p -c 256 "./target/proof" | tr -d '\n'; echo; } > "./target/zkv_proof.hex"

# Convert vk to hexadecimal format
{ printf "0x"; xxd -p -c 256 "./target/vk" | tr -d '\n'; echo; } > "./target/zkv_vk.hex"

# Convert public inputs to hexadecimal format
{ printf "0x"; xxd -p -c 256 "./target/public_inputs" | tr -d '\n'; echo; } > "./target/zkv_pubs.hex"

```
</TabItem>

<TabItem value="ultraplonk" label="Ultraplonk">
We will use the quickstart Noir Lang guide to generate an UltraPlonk proof and will verify it on zkVerify. We will not be going in detail about Noir implementation, our focus would be on verifying those proofs efficiently on zkVerify.

## Steps Involved
- Installing Noir using noirup, and also installing bb (Barretenberg's Backend) using bbup 
- Generating Noir UltraPlonk proofs
- Converting the proof and vk to required hex format using Noir-CLI
- Verifying our proofs on zkVerify and getting proof receipts
- Verifying the proof receipts on Ethereum

To start this tutorial, first we need to install the Noir toolkit using noirup tool. Also, to generate the proofs we need to install Barretenberg's Backend used by Noir Toolkit. Run the following commands to install the requirements:

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
:::warning
Starting from [bbup v.0.87.0](https://github.com/AztecProtocol/aztec-packages/pull/13800) Ultraplonk has been officially deprecated.
To keep submitting Noir proofs via zkVerify, please switch to a previous bbup version(recommended 0.76.4).
You can do this via the command:
`bbup -v <version>`
:::

4. Install Barretenberg's Backend by running bbup command:
```bash
bbup -v <version>
```

5. Create hello_world noir project using the following command:
```bash
nargo new hello_world
```

After implementing all the commands given above, you would have created the hello-world example Noir project. To learn more about this project you can check out [Noir docs](https://noir-lang.org/docs/getting_started/quick_start). Now we will generate proofs using the Noir toolkit for our hello_world project.

To generate proofs, first we need to create a `Prover.toml` file, which will hold our inputs for the hello_world noir circuit. Populate the `Prover.toml` file with the inputs given below :
```toml
x = "1"
y = "2"
```

Let's execute our hello_world circuit and get our witness value, which will be used to generate proofs and vk. Use the following command to execute:
```bash
nargo execute
```

Once we have generated our witness, we can generate proof and vk using the bb toolkit. Use the following command to generate the required files:
```bash
# To generate proof
bb prove -b ./target/hello_world.json -w ./target/hello_world.gz -o ./target/proof

# To generate vk
bb write_vk -b ./target/hello_world.json -o ./target/vk

```

After running these commands, you will have two files, namely: ``proof`` and ``vk`` inside the ``target`` folder which will be used for verification.
</TabItem>

<TabItem value="risc-zero" label="Risc Zero">
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
</TabItem>

<TabItem value="sxt" label="SxT">
We are going to use the [`sxt-proof-of-sql` library developed by Space and Time Labs](https://github.com/spaceandtimelabs/sxt-proof-of-sql) to generate a zk-proof of the simple SQL query
```sql
SELECT a, b, c, d, e, f, g, h FROM table WHERE a = 2
```
on the following table

| a   | b     | c   | d      | e    | f    | g    | h     |
| --- | ----- | --- | ------ | ---- | ---- | ---- | ----- |
| 1   | hello | foo | dc     | hide | yin  | chip | vim   |
| 2   | bye   | bar | marvel | seek | yang | dale | emacs |

whose result is the table

| a   | b   | c   | d      | e    | f    | g    | h     |
| --- | --- | --- | ------ | ---- | ---- | ---- | ----- |
| 2   | bye | bar | marvel | seek | yang | dale | emacs |

Then you will send the proof to zkVerify for on-chain verification.

## Requirements

In order to follow this tutorial, you should have:
- A copy of the [`Horizenlabs/proof-of-sql-verifier`](https://github.com/HorizenLabs/proof-of-sql-verifier) repository:
    * if you have `git` installed on your system, you can just issue the command

    ```bash
    git clone https://github.com/HorizenLabs/proof-of-sql-verifier.git
    ```
    * otherwise, you can download a [zipped version](https://github.com/HorizenLabs/proof-of-sql-verifier/archive/refs/heads/main.zip) of the repository, and uncompress it
- A recent version of the rust toolchain (version `>=1.81.0`). See the [official instructions](https://www.rust-lang.org/tools/install) for instructions on how to install

## Generating the proving artifacts

In order to generate the zk-proof, go into the `proof-of-sql-verifier` directory
```bash
cd proof-of-sql-verifier
```

and run the command
```bash
cargo run --bin generate-sample-proof --features="rand test clap" -- --max-nu=4
```

This command can take a while to run, especially the first time, since it must compile the project from scratch. At the end it should generate three files: `VALID_PROOF_MAX_NU_4.bin`, `VALID_VK_MAX_NU_4.bin`, and `VALID_PUBS_MAX_NU_4.bin`.

If you happen to know a bit of Rust and SQL, you can take a look into `src/bin/generate-sample-proof.rs` source code and try modifying the table and query. If your table has more than `2^(4*2) = 256` rows, you may need to increase the value of the `max-nu` parameter accordingly. At the moment, we support a value of `max-nu` up to 8, corresponding to `2^(8*2) = 65536`, and tables with up to 8 columns.
</TabItem>

</Tabs>

After generating proofs, there are multiple ways in which you can verify it on [zkVerify](https://zkverify.io). The recommended way to verify proofs on zkVerify is by using the [zkVerifyJS package](./06-zkverify-js.md). You can verify proofs using anyone of the following :-
1. Using [Relayer Service](./05-relayer.md)
2. Using [zkVerifyJS package](./06-zkverify-js.md)
3. Using [Polkadot.js frontend](https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Ftestnet-rpc.zkverify.io#/extrinsics)
4. Using the [subxt](https://github.com/paritytech/subxt) rust crate