---
title: Submit a Space and Time Proof of SQL proof
---

In this tutorial you are going to use the [`sxt-proof-of-sql` library developed by Space and Time Labs](https://github.com/spaceandtimelabs/sxt-proof-of-sql) to generate a zk-proof of the simple SQL query
```sql
SELECT a, b, c, d, e, f, g, h FROM table WHERE a = 2
```
on the following table

| a | b     | c   | d      | e    | f    | g    | h     |
|---|-------|-----|--------|------|------|------|-------|
| 1 | hello | foo | dc     | hide | yin  | chip | vim   |
| 2 | bye   | bar | marvel | seek | yang | dale | emacs |

whose result is the table

| a | b     | c   | d      | e    | f    | g    | h     |
|---|-------|-----|--------|------|------|------|-------|
| 2 | bye   | bar | marvel | seek | yang | dale | emacs |

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

## Submitting the proof to zkVerify via `polkadot.js.org` frontend

1. Head to [polkadot.js.org frontend](https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Ftestnet-rpc.zkverify.io#/extrinsics)
2. Select your account (you must have some ACME).
3. Choose the `settlementProofOfSqlPallet`, and the `submitProof` extrinsic.
4. Inside the field `vkOrHash` select `Vk`
5. Fill in all the required fields by toggling the `file upload` switch, and uploading the vk, proof, and pubs files generated in the previous section.
6. Click on the `submitTransaction` button.