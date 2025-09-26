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

:::warning
Recommended bb version 0.84.0
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
bb prove -s ultra_honk -b ./target/hello_world.json -w ./target/hello_world.gz -o ./target --oracle_hash keccak --zk

# To generate vk
bb write_vk -s ultra_honk -b ./target/hello_world.json -o ./target --oracle_hash keccak

```

After running these commands, you will have three files, namely: `proof`, `public_inputs`, and `vk` inside the `target` folder which will be used for verification.

To convert the three files into hex format, run the following Bash commands:
```bash
# Convert proof to hexadecimal format
printf "\"0x%s\"\n" "$(xxd -p -c 0 "./target/proof")" > zkv_proof.hex

# Convert vk to hexadecimal format
printf "\"0x%s\"\n" "$(xxd -p -c 0 "./target/vk")" > zkv_vk.hex

# Convert public inputs to hexadecimal format
xxd -p -c 32 ./target/public_inputs | sed 's/.*/"0x&"/' | paste -sd, - | sed 's/.*/[&]/' > zkv_pubs.hex

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

To generate proofs, first we need to create a `Prover.toml` file, which will hold our inputs for the hello_world noir circuit. Populate the `Prover.toml` file with the inputs given below:
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

After running these commands, you will have two files, namely: `proof` and `vk` inside the `target` folder which will be used for verification.
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

Note this tutorial is based on version `2.2.0` of Risc0 toolchain. Very likely you should be able to follow it using a more recent version, but in case you encounter any issue you can explicitly target that version with command `rzup --version 2.2.0`.

:::

## Building the application

In this tutorial you will build an application which receives a string as input, performs its sha256 hashing and returns back the hash as output. Leveraging the zero knowledge feature of Risc0 zkVM, you are able to show that you know some input that hashes to that specific output without actually showing the input. This use case can be significant for example when proving ownership of confidential data, like a password or a private key.

:::tip[**Don't get confused with terminology!**]

Make sure not to make confusion between _application inputs_ and _verification public inputs_. When you run the application it is supposed you are in a private environment, you provide it with whatever application inputs you want and you have to keep them private; after the run, you get back the proof of execution and the outputs of the execution. The outputs can be safely shared with other parties, indeed they become the public inputs of the verification phase (performed by other parties).

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

  - Open the file `hasher/host/src/main.rs`. After all the imports add the following:
    ```rust
    use serde::Serialize;
    use std::{fs::File, io::Write};
    #[derive(Serialize)]
    pub struct Proof{
        proof: String,
        image_id: String,
        pub_inputs: String
    }
    ```

    And then replace these lines:

    ```rust
    // For example:
    let input: u32 = 15 * u32::pow(2, 27) + 1;
    ```

    with the following code:

    ```rust
    let input: String = std::env::args().nth(1).unwrap();
    println!("Input argument is: {}", input);
    ```

    and these lines:

    ```rust
    // TODO: Implement code for retrieving receipt journal here.
    // For example:
    let _output: u32 = receipt.journal.decode().unwrap();
    ```

    with the following code:

    ```rust
    let mut bin_receipt = Vec::new();
    ciborium::into_writer(&receipt, &mut bin_receipt).unwrap();
    let image_id_hex = hex::encode(
        HASHER_GUEST_ID
            .into_iter()
            .flat_map(|v| v.to_le_bytes().into_iter())
            .collect::<Vec<_>>(),
    );
    let receipt_journal_bytes_array = &receipt.journal.bytes.as_slice();
    let proof = Proof{
        proof: "0x".to_string()+&hex::encode(&bin_receipt),
        image_id: "0x".to_string()+&image_id_hex,
        pub_inputs: "0x".to_string()+&hex::encode(&receipt_journal_bytes_array)
    };

    let json_string = serde_json::to_string_pretty(&proof).unwrap();
    let mut file = File::create("proof_output.json").unwrap();
    file.write_all(json_string.as_bytes()).unwrap();
    ```

  In this way you have prepared the host to easily receive command-line argument and to save the proof json data in `proof.json`, which will be useful in a later step when you need to submit them on the zkVerify Mainchain.

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

- The serialized proof (`receipt_inner_bytes_array` string).
- The serialized outputs (`receipt_journal_bytes_array`).
- The guest program fingerprint, known as image id (`image_id_hex`).

They will be used respectively as proof, public inputs and verification key during the verification phase.

Now that you have learned how to set up and run your Risc0 zkVM application you can play a bit with the guest program code and modify the execution logic.
</TabItem>

<TabItem value="sp1" label="SP1">

Submitting a SP1 proof to zkVerify SP1 verification pallet requires first to generate a compressed SP1 proof.
To quickly try this out, you can follow the [official SP1 quickstart guide](https://docs.succinct.xyz/docs/sp1/getting-started/quickstart) for creating an example fibonacci application, and then execute the following code, in place of the provided `script/main.rs`:

```rust
use sp1_sdk::{include_elf, Prover, ProverClient, SP1Stdin};

pub const FIBONACCI_ELF: &[u8] = include_elf!("fibonacci-program");

fn main() {
    // Setup the inputs.
    let mut stdin = SP1Stdin::new();
    let n: u32 = 20;
    stdin.write(&n);

    // Setup the prover client.
    let client = ProverClient::from_env();

    // Setup the program for proving.
    let (pk, vk) = client.setup(FIBONACCI_ELF);

    // Generate the SP1 proof in compressed mode.
    let proof = client
        .prove(&pk, &stdin)
        .compressed()
        .run()
        .expect("failed to generate proof");
}
```

<Tabs groupId="sp1-zkv-sdk">
<TabItem value="with-sdk" label="With sp1_zkv_sdk">


After having obtained a compressed proof, it's necessary to post-process the proof (alongside the verification key, and public inputs) to obtain a `serialized_proof`, a `vk_hash`, and `public_values` as required by the SP1 verification pallet.
The [`sp1_zkv_sdk`](https://github.com/zkVerify/sp1-verifier/tree/main/sp1-zkv-sdk) crate contains utility functions to perform the relevant conversions.

Add these following dependencies below the `[dependencies]` tab in your Cargo.toml file of the script folder:
```toml
bincode = { version = "2", features = ["serde"] }
sp1-zkv-sdk = { git="https://github.com/zkVerify/sp1-verifier" }
```

And then add the following imports to your `script/Cargo.toml`:
```rust
use sp1_zkv_sdk::*; // for the `convert_to_zkv` and `hash_bytes` methods.
use std::{fs::File, io::Write};
use serde::{Deserialize, Serialize};

// Struct of the output we need
#[derive(Serialize, Deserialize)]
struct Output{
    image_id: String,
    pub_inputs: String,
    proof: String
}

// Helper function to get hex strings
fn to_hex_with_prefix(bytes: &[u8]) -> String {
    let hex_string: String = bytes.iter()
        .map(|b| format!("{:02x}", b))
        .collect();
    format!("0x{}", hex_string)
}
```

Now, add these lines after the proof is generated by the SP1 prover sdk:
```rust
// Convert proof and vk into a zkVerify-compatible proof.
let SP1ZkvProofWithPublicValues {
    proof: shrunk_proof,
    public_values,
} = client
    .convert_proof_to_zkv(proof, Default::default())
    .unwrap();
let vk_hash = vk.hash_bytes();

// Serialize the proof
let serialized_proof = bincode::serde::encode_to_vec(&shrunk_proof, bincode::config::legacy())
    .expect("failed to serialize proof");

// Convert to required struct
let output = Output{
    proof: to_hex_with_prefix(&serialized_proof),
    image_id: to_hex_with_prefix(&vk_hash),
    pub_inputs: to_hex_with_prefix(&public_values),
};

// Convert to JSON and store in the file
let json_string = serde_json::to_string_pretty(&output)
    .expect("Failed to serialize to JSON.");

let mut file = File::create("proof.json").unwrap();
file.write_all(json_string.as_bytes()).unwrap();
```
</TabItem>
<TabItem value="without-sdk" label="Without sp1_zkv_sdk">
If you'd rather not depend on `sp1_zkv_sdk` in your application, the following sections show code snippets to perform the required conversions.
First you would need to add these following dependencies below the `[dependencies]` tab in your Cargo.toml file of the script folder:
```toml
bincode = { version = "2", features = ["serde"] }
```

Next we need to import all the important modules and create a structure to store our proof. Add these following lines after all the imports in ``script/Cargo.toml`` file:
```rust
use sp1_sdk::HashableKey;   // for the `hash_babybear` method.
use std::{fs::File, io::Write};
use serde::{Deserialize, Serialize};

// Struct of the output we need
#[derive(Serialize, Deserialize)]
struct Output{
    image_id: String,
    pub_inputs: String,
    proof: String
}

// Helper function to get hex strings
fn to_hex_with_prefix(bytes: &[u8]) -> String {
    let hex_string: String = bytes.iter()
        .map(|b| format!("{:02x}", b))
        .collect();
    format!("0x{}", hex_string)
}
```

### Proof

The SP1 verification pallet supports shrunk STARK proofs. Here's the code to generate it from the `proof` obtained in the section `Proof generation`, you need to paste this after the proof is generated by the SP1 prover SDK:

```rust
// Extract the inner compressed proof.
let compressed_proof = proof
    .proof
    .try_as_compressed()
    .expect("proof is not compressed");

// Shrink the compressed proof.
let SP1ReduceProof {
    vk,
    proof: shard_proof,
} = client
    .inner()
    .shrink(*compressed_proof, Default::default())
    .expect("failed to shrink");

let input = SP1CompressWitnessValues {
    vks_and_proofs: vec![(vk.clone(), shard_proof.clone())],
    is_complete: true,
};
let proof_with_vk_and_merkle = self.inner().make_merkle_proofs(input);
let zkv_proof = Proof {
    shard_proof,
    vk,
    vk_merkle_proof: proof_with_vk_and_merkle.merkle_val.vk_merkle_proofs[0].clone(),
}

// Serialize the shrunk_proof
let serialized_proof = bincode::serde::encode_to_vec(&zkv_proof, bincode::config::legacy())
  .expect("failed to serialize proof");

```

### Verification Key

The SP1 verification pallet accepts verification keys hashed with the `hash_babybear` method, and serialized as little endian bytes. Here's a code snippet showing the process:

```rust
// `vk` is the verification key obtained from `ProverClient::setup` method.
let vk_hash: [u8; 32] = vk.hash_bytes();
```

### Public Values

SP1 verification pallet accepts public inputs expressed as a vector of bytes, which can be retrieved from the initial `SP1ProofWithPublicValues` proof:

```rust
let public_values = proof.public_values.to_vec();
```

### Storing the output

Once we have generated all the proof artifacts, we will store it in a json file which will be used later while verification. Paste the following code snippet to store your artifacts into the required structure:
```rust
let output = Output{
    proof: to_hex_with_prefix(&serialized_proof),
    image_id: to_hex_with_prefix(&vk_hash),
    pub_inputs: to_hex_with_prefix(&public_values),
};

let json_string = serde_json::to_string_pretty(&output)
    .expect("Failed to serialize to JSON.");

let mut file = File::create("proof.json").unwrap();
file.write_all(json_string.as_bytes()).unwrap();
```
</TabItem>
</Tabs>
</TabItem>

<TabItem value="ezkl" label="EZKL">
We will use the quickstart Noir guide by zkonduit to generate an EZKL proof and will verify it on zkVerify. We will not be going into detail about EZKL's implementation, our focus would be on verifying those proofs efficiently on zkVerify.

## Steps Involved
- Installing EZKL and dependencies
- Generating EZKL proofs
- Converting the proof, vk, and instances (public inputs) to required hex format using Bash
- Verifying our proofs on zkVerify and getting proof receipts
- Verifying the proof receipts on Ethereum

To start this tutorial, first we need to install the EZKL zkML library. For the purposes of this tutorial, we will be primarily using the Bash CLI. However, for defining our model, we will rely on Python3 and PyTorch. Use of a virtual environment is recommended. For alternatives, please consult the [EZKL documentation](https://docs.ezkl.xyz/getting-started/setup/) by zkonduit. Run the following commands to install the requirements:

1. Install ezkl by running the following command:
```bash
curl https://raw.githubusercontent.com/zkonduit/ezkl/main/install_ezkl_cli.sh | bash
```

2. Install ONNX:
```bash
pip install onnx
```

3. Install PyTorch:
```bash
pip install torch torchvision
```

4. Alternatively, you can install Tensorflow:
```bash
pip install tensorflow
```

5. Define your model, export it to `network.onnx`, and create an `input.json` file.
For illustration, let's create a Python script for defining a simple model that learns the linear function $y = 2x + 1$. We will call it `export_model.py`.

```python
import torch
import torch.nn as nn
import json
import os

# 1. DEFINE THE PYTORCH MODEL
class SimpleModel(nn.Module):
    def __init__(self):
        super(SimpleModel, self).__init__()
        self.linear = nn.Linear(1, 1)
        # Manually set weights to learn y = 2x + 1
        self.linear.weight.data.fill_(2.0)
        self.linear.bias.data.fill_(1.0)

    def forward(self, x):
        return self.linear(x)

# 2. EXPORT TO ONNX
model = SimpleModel()
model.eval()

# Define a dummy input for the ONNX export
dummy_input = torch.randn(1, 1)
onnx_path = "network.onnx"
torch.onnx.export(model, dummy_input, onnx_path, export_params=True, input_names=['input'], output_names=['output'])

print(f"Model exported to {onnx_path}")

# 3. CREATE THE INPUT DATA FILE
# Let's test with an input of x = 2. We expect the output to be 2*2 + 1 = 5
input_data = dict(input_data = [[2.0]])
json_path = "input.json"

with open(json_path, 'w') as f:
    json.dump(input_data, f)

print(f"Input data saved to {json_path}")
```

Grant the script execution permissions by running `chmod +x export_model.py` in a Bash shell and then run it using the command `python3 export_model.py`. After the script is finished, you should have two files, namely, `network.onnx` and `input.json`. We are now ready to start using `ezkl`.

6. Generate Settings: To inspect the model and create a configuration file, run:

```bash
ezkl gen-settings -M network.onnx
```

This should generate `settings.json`.

7. Calibrate Settings: This step is crucial as it runs a mock forward pass to determine the best fixed-point scaling for the numbers in your model. This helps prevent proofs from failing due to arithmetic errors. Run:

```bash
ezkl calibrate-settings -D input.json -M network.onnx --settings-path settings.json
```

This modifies `settings.json` with optimal parameters.

8. Compile the Model: This step transforms your neural network into an arithmetic circuit, the fundamental object for which we can create proofs. Run:

```bash
ezkl compile-circuit -M network.onnx --settings-path settings.json
```

This should generate the `model.compiled` file which contains an optimized format of the model for zero-knowledge proofs.

9. Run the Trusted Setup to generate the cryptographic keys.

Run the command:

```bash
ezkl setup -M model.compiled --pk-path pk.key --vk-path vk.key
```

You should now have a proving key (for the prover) in `pk.key` and a verification key (for the verifier) in `vk.key`.

10. Generate the witness: This step creates a witness file from your input data and compiled model. Simply run:

```bash
ezkl gen-witness
```

This should generate the `witness.json` file.

11. Prove: To generate a zero-knowledge proof using the witness and other artifacts, run:

```bash
ezkl prove -M model.compiled --pk-path pk.key --proof-path proof.json
```

and you should now have a JSON file called `proof.json`. This file contains both the proof and the instances (public inputs).

12. Generate the VKA: The Reusable EZKL verifier relies on an additional artifact called the Verification Key Artifact (VKA). To generate it, simply run:

```bash
ezkl create-evm-vka
```

and you should be presented with an additional file called `vka.bytes`.

You are almost set. The artifacts `proof.json` and `vka.bytes` contain all the information necessary for verifying the proof using zkVerify. The final step consists of extracting this data and converting them to a format compatible for direct use with zkVerify.

To accomplish this, run the following Bash commands:
```bash
# Convert vka to hexadecimal format
tail -c +9 vka.bytes | xxd -p | tr -d '\n' | sed 's/.*/`{"vkBytes": "0x&"}`/' > zkv_vk.hex

# Convert proof to hexadecimal format
jq -r '.proof[] | select(type == "number")' proof.json | awk 'BEGIN {printf "\"0x"} {printf "%02x", $1} END {printf "\"\n"}' > zkv_proof.hex

# Convert public inputs (instances) to hexadecimal format
echo "[$(jq -r '.instances | flatten | map("\"0x\(.)\"") | join(", ")' proof.json)]" > zkv_pubs.hex
```
</TabItem>

</Tabs>

After generating proofs, there are multiple ways in which you can verify it on [zkVerify](https://zkverify.io). The recommended way to verify proofs on zkVerify is by using the [Relayer Service](./05-relayer.md). You can verify proofs using anyone of the following :-

1. Using [Relayer Service](./05-relayer.md)
2. Using [zkVerifyJS package](./06-zkverify-js.md)
3. Using [Polkadot.js frontend](https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fzkverify-volta-rpc.zkverify.io#/extrinsics)
4. Using the [subxt](https://github.com/paritytech/subxt) rust crate
