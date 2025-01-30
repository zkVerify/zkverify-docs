---
title: Getting Started - Binaries
---

## Prerequisites

To run a **zkVerify** node, it is recommended users use a Linux machine for a better deployment experience.

Below is a list of prerequisites that need to be available on your machine in order to build the **zkVerify** source code:

- Rustup tool for Rust programming language: can be installed with `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`,
- Rust source code for Rust toolchain: can be added with `rustup component add rust-src`,
- Wasm target for Rust toolchain: can be added with `rustup target add wasm32-unknown-unknown`,
- `protoc` compiler: can be installed with `sudo apt install protobuf-compiler`,
- `clang` compiler: can be installed with `sudo apt install clang`,

Check the [releases page](https://github.com/HorizenLabs/zkVerify/release) and note the latest tag `latest_tag`.
Lastly, clone the repository [zkVerify](https://github.com/HorizenLabs/zkVerify) with the command:

```bash
git clone --branch latest_tag https://github.com/HorizenLabs/zkVerify.git
```

:::tip[**Recommendation: use the latest tag**]
It is recommended that you use the latest tag in order to run the latest and most updated software. Check the [releases page](https://github.com/HorizenLabs/zkVerify/releases) to find the latest tag and if needed update it accordingly via the command or link provided above (e.g `latest_tag` -> `x.x.x`). You can also target directly `main` branch using `git clone https://github.com/HorizenLabs/zkVerify.git` but ensure that you fully understand the implications of doing so.
:::

This repository contains the implementation of a **zkVerify** node. It is based on the [Substrate](https://substrate.io/) framework.

## Building the Binaries from Source Code

:::warning
Compilation of one of the dependencies requires you to fulfill the following [requirements](https://github.com/AztecProtocol/aztec-packages/tree/master/barretenberg#development).
Please take extra care, especially if you are a Mac user, where we know issues come up quite frequently.
Feel free to reach us out on Discord if you need help in troubleshooting.
We are working towards removing this dependency in the upcoming future.
:::

To build the source code, open a terminal at `root` and type:

```bash
cargo build -p mainchain --profile production
```

or:

```bash
cargo build -p mainchain
```

For a debug build.

The build process downloads all the dependencies and can take several minutes on the first run.  When finished, you can find the build output in directory `target/production` (or `target/debug`).  The node executable is `zkv-node`.

In case you need to clean your workspace removing the previous build output, run:

```bash
cargo clean
```

## Node Command-Line Utilities

Apart from the execution of the node itself, `zkv-node` provides some command-based utility features. Important features to note are:

- Command `key`:
  - Subcommands `generate`, `inspect`, `insert` allow you to handle generation, parsing and insertion of account keys (those used for example by Babe and Grandpa algorithm).  These are important if you choose to run a validator node.
  - subcommands `generate-node-key`, `inspect-node-key` allow you to handle generation and parsing of node keys (those used for signing peer-to-peer messages and for uniquely identifying the node within the network).  These are important if you decide to run a boot node.
  - Use `target/production/zkv-node key --help` for additional details,
- Command `build-spec`:
  - Allows you to create chain-spec file.
  - Use `target/production/zkv-node build-spec --help` for additional details.

## Node Common Configuration

In the next pages you'll find instructions on how to run `zkv-node` in different modes and how to set the proper command-line arguments. Keep in mind that **zkVerify** nodes are based on the [Substrate node template](https://docs.substrate.io/reference/command-line-tools/node-template/).  Therefore they support the same set of command-line arguments as the template. To get a detailed description for each command, run:

```bash
target/production/zkv-node --help
```

The common command-line arguments you want to set regardless of the node type you pick are:

| Name        | Description                                                                                                                                                                                                 | Value                                                                     |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| --name      | The human-readable name for this node.<br/> It's used as network node name.                                                                                                                                 | Whatever you want.                                                        |
| --base-path | Specify custom base path.                                                                                                                                                                                   | Absolute or relative path.                                                |
| --chain     | Specify the chain specification.<br/> It can be one of the predefined ones (dev, local, or staging) or it can be a path to a file with the chainspec (such as one exported by the `build-spec` subcommand). | `test` for joining **zkVerify** testnet.                                  |
| --port      | Specify p2p protocol TCP port                                                                                                                                                                               | Any number, but make sure the port is not already in use on your machine. |
