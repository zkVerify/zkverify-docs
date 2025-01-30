---
title: Polygon CDK
---

## Introduction

This tutorial takes you through the process of deploying a full CDK zkRollup, EVM-compatible network on Sepolia that uses zkVerify Mainchain as Proof Verification layer.

It relies on specific component versions so we have hidden most of the configuration complexity in scripts to make the process straightforward.


## Prerequisites

CDK node requirements:
- Linux-based OS
- Minimum 16GB RAM, 4-core CPU

Prover tested requirements:
- Linux-based OS
- 96-core CPU
- 740 GB RAM

Miscellaneous requirements:
- Infura API key
- At least 10 ACME on zkVerify Mainchain
- At least 5 ETH on Sepolia (faucet [here](https://www.alchemy.com/faucets/ethereum-sepolia) or you can buy [here](https://www.sepoliaeth.com/buy-sepolia-eth))

## CDK Smart Contracts deployment

- Clone the repository https://github.com/HorizenLabs/cdk-validium-contracts and checkout on the latest stable release.
- Install project dependencies.

```
cd cdk-validium-contracts && npm i
```

- Create a `.env` file similar to the `.env.template` and fill the environment variables.

```
cd deployment && cp deploy_parameters.json.example deploy_parameters.json
```

- Fill the file `deploy_parameters.json` as follow.

```json
 {
  "realVerifier": true,
    "trustedSequencerURL": "http://zkevm-json-rpc:8123",
    "networkName": "cdk-validium",
    "version":"0.0.1",
    "trustedSequencer":"<YOUR ADDRESS>",
    "chainID": <YOUR_CHAIN_ID>,
    "trustedAggregator":"<YOUR ADDRESS>",
    "trustedAggregatorTimeout": 604799,
    "pendingStateTimeout": 604799,
    "forkID": 6,
    "admin":"<YOUR ADDRESS>",
    "cdkValidiumOwner": "<YOUR ADDRESS>",
    "timelockAddress": "<YOUR ADDRESS>",
    "minDelayTimelock": 3600,
    "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "initialCDKValidiumDeployerOwner" :"<YOUR ADDRESS>",
    "maticTokenAddress":"",
    "cdkValidiumDeployerAddress":"",
    "deployerPvtKey": "",
    "maxFeePerGas":"",
    "maxPriorityFeePerGas":"",
    "multiplierGas": "",
    "setupEmptyCommittee": true,
    "committeeTimelock": false,
    "newHorizenAttestationAddress": "<OPERATOR ADDRESS OF ZKVERIFY SMART CONTRACT>",
    "newHorizenContractAddress": "<ADDRESS OF ZKVERIFY SMART CONTRACT>"
}
```

Feel free to leave the `newHorizenContractAddress` field empty for the first deployment, as a new instance will be automatically deployed for you.  If so desired, you may populate this field for subsequent deployments to avoid re-deploying that contract.
Before each deployment, you must delete the folder .openzeppelin located in the project root and change the salt in the `deploy_parameters.json` file.

- Deploy the CDK deployer:

```
npm run deploy:deployer:CDKValidium:sepolia
```

- Deploy the CDK contracts and the zkVerify Smart Contract. This contract receives the Attestations created by the zkVerify Mainchain and It is used by the `CDKValidium.sol` contract to check if a batch proof is verified or not.

```
npm run deploy:testnet:CDKValidium:sepolia
```

- If the deployment is complete with success you will find a file under the deployment folder named `test.genesis.confing.json`. This file is the genesis file of your L2 network. We will use this file in the next step.

## CDK Node deployment

- Clone the repository https://github.com/HorizenLabs/cdk-validium-node and checkout on the latest stable release.
- Build the docker image.

```
docker build -t zkevm-node:latest .
```

- Go into the test folder and copy the file  `test.genesis.confing.json` generated in the above steps into the config folder.
- Run the following script with the Aggregator private key and the Sequencer private key used in the smart contract deployment and store the result in the corresponding file `aggregator.keystore` and `sequencer.keystore`.

```
const ethers = require("ethers");

async function main() {
    const wallet = new ethers.Wallet(ethers.Wallet.fromMnemonic("INSERT_PRIVATE_KEY_HERE"));
    console.log(wallet.address)
    const keystoreJson = await wallet.encrypt("testonly");
    console.log(`keystore: ${keystoreJson}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
```

- Fill the missing data in the `config/test.node.config.toml`.(_PLACEHOLDER_)
- Copy the `.env.template` file in `.env` and fill the missing data.
- To run the node type:

```
make prod-run
```

- To stop the node:

```
make prod-stop
```

- To clean the node (BE CAREFUL THIS WILL LOSE ALL OF YOUR DATA, DO IT ONLY WHEN YOU WANT TO DEPLOY A NEW INSTANCE OF THE CDK).

```
make cleanup
```

- To run the explorer:

```
make run-l2-explorer
```

## ZKEvm Prover deployment

- Clone the repository https://github.com/HorizenLabs/zkevm-prover.
- Go into zkevm-prover folder and run to prepare and patch the sources

```
cd zkevm-prover
./bootstrap.sh
```

- Go into deploy folder and run `prepare.sh` script to compile and create the docker image (could take several minutes)

```
cd deploy
./prepare.sh
```

- Edit `config.json` file and check:
- - `aggregatorClientHost` should be the CDK aggregator reachable address
- - `databaseURL` should be CDK Postgres URI
- Start docker compose compose:

```
docker compose up -d
```
