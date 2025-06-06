---
title: Getting Started - Docker
---

Pre-built docker images of the zkVerify node are available on [DockerHub](https://hub.docker.com/r/horizenlabs/zkverify/tags). These images are built for the `amd64` architecture. If you want to run a node on a different architecture (e.g. Apple Silicon chips), then please refer to the [Run Using Binaries](../03-run_using_binaries/01-getting_started_binaries.md) section.

## Prerequisites

Before you begin running your **zkVerify** node, ensure that you have the following installed on your machine:

- Docker,
- Docker Compose (v2),
- `jq` tool,
- `gnu-sed` tool (macOS only).

In order to check Docker and Docker Compose availability, open a terminal and type:

```bash
docker --version
```

then type:

```bash
docker compose version
```

If any of the commands result in an error, you can follow the instructions from the official [Docker guide](https://docs.docker.com/engine/install/) and [Docker Compose guide](https://docs.docker.com/compose/install/).

:::note
From here throughout the rest of the guide, a very basic understanding of Docker concepts and features is assumed. If you're unfamiliar, proceed anyway and seek additional information online as needed.
:::

To check your machine for `jq` tool availability, open a terminal and type:

```bash
jq --version
```

If the command results in an error, you can install `jq` with:

- Linux: command `sudo apt install jq`,
- macOS: command `brew install jq`,
- Windows: download it from the [official GitHub release page](https://github.com/jqlang/jq/releases/), rename the executable as `jq.exe` and save it in a directory that's part of your system's `PATH` (e.g. `C:\Windows\System32` or `C:\Windows`).

To check your machine for `gnu-sed` tool availability (macOS only), open a terminal and type:

```bash
gsed --version
```

If the command results in an error, you can install `gnu-sed` with:

```bash
brew install gsed
```
Check the [releases page](https://github.com/zkVerify/compose-zkverify-simplified/releases) and checkout the latest tag `latest_tag`.
Finally, clone the repository [compose-zkverify-simplified](https://github.com/zkVerify/compose-zkverify-simplified) with the command:

```bash
git clone --branch latest_tag https://github.com/zkVerify/compose-zkverify-simplified.git
```

Or directly download the [archive](https://github.com/zkVerify/compose-zkverify-simplified/releases) and unzip it.

:::tip[**Recommendation: use the latest tag**]
It is recommended that you use the latest tag in order to run the latest and most updated software. Check the [releases page](https://github.com/zkVerify/compose-zkverify-simplified/releases) to find the latest tag and if needed update it accordingly via the command or link provided above (e.g `latest_tag` -> `x.x.x`).
:::

This repository contains several resources to help you in the preparation of the environment for running your node.

## Basic Items

Inside the repository `compose-zkverify-simplified` you can find the main tool you'll use for preparing your environment, the script `scripts/init.sh`. It acts as a step-by-step guide, collecting from you all the requirements and taking care of preparing all the files needed.

:::tip[**For Windows users**]
A couple of additional checks when running `scripts/init.sh` are required:

- Make sure Docker engine is running (e.g. verifying it from Docker Desktop),
- Make sure you can run `.sh` scripts on your machine
  - The suggested option is to install [Git](https://git-scm.com/downloads/win)
  - Then you can just double click on `init.sh` or use Git Bash tool.

:::

Following is a brief overview of the basic items required to actually run the node:

- The Docker image `horizenlabs/zkverify`:
  - This is the **zkVerify** software packaged up in a Docker image.  It allows you to run the node consistently on every platform (Linux, Windows, macOS, ...).
  - The recommended tag is `latest`, otherwise you can choose another one from DockerHub.
  - Unless already available on your machine, it will be automatically downloaded from DockerHub by Docker Compose file (see below).
  - You can also choose to build this image using the Docker file [`hl-node.Dockerfile`](https://github.com/zkVerify/zkVerify/blob/main/docker/dockerfiles/hl-node.Dockerfile).
- Docker Compose file:
  - A common Docker template used to launch the node.
  - This is automatically generated by `init.sh`.
- `.env` file:
  - This is the configuration file for your node.
  - It is automatically generated by `init.sh`.
- Secret files:
  - `secret_phrase.dat` file: contains a secret phrase composed of 12 random words selected among a specific dictionary. It is used for generating private and public keys required for authoring and finalizing blocks (needed only for validator nodes).
  - `node_key.dat` file: contains a random 256-bits number. It is the private key required for signing peer-to-peer (p2p) messages and uniquely identifying the node within the network (peer-id).
  - These are automatically generated by `init.sh`.
