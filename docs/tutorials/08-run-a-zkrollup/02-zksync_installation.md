---
title: zkSync Era
---

## Introduction

This tutorial takes you through the process of deploying locally a full zkSync-era instance that uses zkVerify as Proof Verification layer.

It relies on specific component versions so we have hidden most of the configuration complexity in scripts to make the process straightforward.


## Prerequisites

zkSync-era requirements:
- https://github.com/HorizenLabs/zksync-era/blob/main-hl/docs/guides/setup-dev.md

Miscellaneous requirements:
- Some ACME token

## zkSync local deployment

- Clone the zksync-era repo (or pull the latest if you've already cloned it) and go to the root of it:

```
git clone https://github.com/HorizenLabs/zksync-era.git -b main-hl
```

- Add `ZKSYNC_HOME` to your path (e.g. `~/.bash_profile`, `~/.zshrc` ) - don't forget to source your profile file again (or restart your terminal)

```
export ZKSYNC_HOME=/path/to/zksync/repo/you/cloned
export PATH=$ZKSYNC_HOME/bin:$PATH
```

- Build latest version of zk tools by just running `zk` on the root of the project.

```
zk
```

- Add to the file `etc/env/dev.env/dev` the following lines:

```
NEW_HORIZEN_URL= <URL to zkVerify node > (e.g.ws://localhost:9944)
NEW_HORIZEN_SEED_PHRASE= <Seed phrase of a funded zkVerify account> (e.g. bottom drive obey lake curtain smoke basket hold race lonely fit walk//Alice)
CONTRACTS_NH_VERIFIER_ADDR=0x0000000000000000000000000000000000000000
CONTRACTS_PROVER_AT_GENESIS=fri
```
- Add to the file `contracts/l1-contracts/.env` the following lines:

```
CONTRACTS_NH_VERIFIER_ADDR=0x0000000000000000000000000000000000000000
CONTRACTS_PROVER_AT_GENESIS=fri
```

- Initialize the chain:

```
zk init
```

The zkVerify Attestation contract (`NewHorizenProofVerifier.sol`) is deployed at every new deployment and the allowed address to publish attestations is the first of these [list](https://github.com/matter-labs/local-setup/blob/main/rich-wallets.json).

- Run the node:

```
zk server --components=api,eth,tree,state_keeper,housekeeper,proof_data_handler, commitment_generator
```

For any additional resources please refer to the zkSync official documentation:

- https://docs.zksync.io/zk-stack/running-a-hyperchain/locally.html
- https://github.com/HorizenLabs/zksync-era/tree/main-hl/docs/guides


## Prover setup

- Setup the GPU prover:

```
zk setup prover gpu
```
- Go into the `prover` folder and run:

```
zk f cargo run --release --bin zksync_prover_fri_gateway
```

- Open a new terminal and run:

```
API_PROMETHEUS_LISTENER_PORT=3116 zk f cargo run --release --bin zksync_witness_generator -- --all_rounds
```

- Open a new terminal and run (you can run up to 10 of this):

```
FRI_WITNESS_VECTOR_GENERATOR_PROMETHEUS_LISTENER_PORT=3420 zk f cargo run --release --bin zksync_witness_vector_generator
```

- Open a new terminal and run:

```
zk f cargo run --features "gpu" --release --bin zksync_prover_fri
```

- Open a new terminal and run:

```
RUST_LOG=info zk f cargo run --release --bin zksync_proof_fri_compressor
```

- Open a new terminal and run:

```
watch --color --interval 1 zk status prover
```

For any additional resources/info please refer to [this](https://github.com/HorizenLabs/zksync-era/blob/main-hl/prover/prover_fri/README.md).
