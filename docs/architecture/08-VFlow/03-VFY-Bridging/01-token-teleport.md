---
title: Teleport Token across zkVerify Parachains
---

## XCM Teleport

A **teleport** is a powerful Cross-Consensus Message (XCM) instruction that facilitates the movement of assets between zkVerify Relay Chain and its System Parachains.

A teleport of an asset (VFY token) is an operation performed in two stages by an XCM executor: one part is executed on the Relay chain (burns the asset) and the other part on the Parachain (minting of the asset).

![alt_text](./img/xcm-asset-teleportation.png)

[Image Source](https://www.google.com/url?sa=i&url=https%3A%2F%2Fwiki.polkadot.network%2Flearn%2Flearn-xcm-usecases%2F&psig=AOvVaw21L2fcOzDMDt-zhRvkjJuv&ust=1752589475818000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCMip9OHGvI4DFQAAAAAdAAAAABA8)

In this guide, we will be using teleport to move VFY tokens from zkVerify to VFlow and viceversa.

You can find more information on XCM [here](https://polkadot.com/blog/xcm-the-cross-consensus-message-format/).

### From zkVerify to VFlow via PolkadotJS-UI

From [PolkadotJS](https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fzkverify-volta-rpc.zkverify.io#/explorer) navigate to `Developer-> Extrinsics` and select the `xcmPallet` pallet and the `teleportAssets` extrinsic:

![alt_text](./img/extrinsic_relay.png)

You can see that we need to supply 4 parameters: `dest`, `beneficiary`, `assets` and `feeAssetItem`.
You can either use the `Quick Teleport Guide` or follow starting from the `Destination` section.

#### Quick Teleport Guide

Go to `Developer -> Extrinsics -> Decode` and copy/paste the following hex:

`0x8c0105000100040500010300000000000000000000000000000000000000000005040000000000000000`

Then from `Decode` move to `Submission`

You need to change the following parameters:

- `beneficiary -> V5 -> X1 -> AccountKey20 -> key: [u8, 20]`: with the EVM address of the receiver on VFlow
- `assets -> V5 -> 0 -> id -> fun -> Fungible: Compact<u128>`: with the amount of VFY tokens you want to teleport to VFlow (specified with 18 digits)

Click on `submitTransaction` and then `sign And Submit` on the new window that will appear to conclude the teleport.

#### Destination

![alt_text](./img/dest_relay.png)

This parameter specifies the target chain where the assets are being teleported. Let's select:

- For `dest: XcmVersionedLocation` select `V5` from the scroll-down menu. New fields will pop-up. Let's set:
    - For `parents` input `0`
    - For `interior` select `X1` from the scroll-down menu. Then new fields will appear. Let's set:
        -For `0` select `Parachain` from the scroll-down menu
        - We need finally to insert the ID of the VFlow `Parachain`, which is `1`.

#### Beneficiary

![alt_text](./img/beneficiary_relay.png)

This specifies the account that will receive the assets on the destination chain. Let's set:

- For `beneficiary: XcmVersionedMultiLocation` select `V5` from the scroll-down menu. New fields will pop-up. Let's set:
    - For `parents` input `0`
    - For `interior` input `X1` from the scroll-down menu. Then new fields will appear. Let's set:
        - For `0` select `AccountKey20` from the scroll-down menu
        - For `key` input the address of the Ethereum account you want to receive the assets on VFlow. 

#### Assets

![alt_text](./img/assets_relay.png)

This defines the actual asset(s) and the amount(s) you are sending. Let's set:

- For `assets: XcmVersionedMultiAsset` select `v5` from the scroll-down menu. Click on the `Add Item` button. New fields will pop-up. Let's set:
    - For `parents` input `0`
    - For `interior` select  `Here` from the scroll-down menu. Then new fields will appear. Let's set:
        - For `fun` select `Fungible` from the scroll-down menu
        - For `Fungible` input the amount of assets you want to send. e.g. to send 1 VFY , remembering that the token has 18 decimals, it's: `1000000000000000000`.

#### Fee Asset Item

This is simply the index of the asset in the `assets` array that will be used to pay for the XCM teleport fee. We only have a single asset (VFY) and we are using that one, so we set it to `0`.

#### Submitting the Extrinsic

Click on `submitTransaction` and then `sign And Submit` on the new window that will appear to conclude the teleport.

### From VFlow to zkVerify via PolkadotJS-UI

The process here is exactly a mirror of what we did on zkVerify side.
From [PolkadotJS](https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fvflow-volta-rpc.zkverify.io#/explorer) navigate to `Developer-> Extrinsics` and select the `zkvXcm` pallet and the `teleportAssets` extrinsic.

![alt_text](./img/extrinsic_para.png)

Like before we need to supply 4 parameters: `dest`, `beneficiary`, `assets` and `feeAssetItem`.
You can either use the `Quick Teleport Guide` or follow starting from the `Destination` section.


#### Quick Teleport Guide

Go to `Developer -> Extrinsics -> Decode` and copy/paste the following hex:

`0x6449595d731d231ccc6624a532469697b10dfea29e2843cc171ba7bdcde1c4cd`

You need to change the following parameters:

- `beneficiary -> V5 -> X1 -> AccountId32 -> id: [u8, 32]`: with the address of the receiver on zkVerify
- `assets -> V5 -> 0 -> id -> fun -> Fungible: Compact<u128>`: with the amount of VFY tokens you want to teleport to zkVerify (specified with 18 digits)

Click on `submitTransaction` and then `sign And Submit` on the new window that will appear to conclude the teleport. 

#### Destination

Let's start with the `dest` parameter:

![alt_text](./img/dest_para.png)

- For `dest: XcmVersionedLocation` select `V5` from the scroll-down menu. New fields will pop-up. Let's set:
    - For `parents` input `1`
    - For `interior` select `Here` from the scroll-down menu. Then new fields will appear. Let's set:

#### Beneficiary

Let's set the `beneficiary` parameter as follows:

![alt_text](./img/beneficiary_para.png)

- For `beneficiary: XcmVersionedMultiLocation` select `V5` from the scroll-down menu. New fields will pop-up. Let's set:
    - For `parents` input `0`
    - For `interior` select `X1` from the scroll-down menu. Then new fields will appear. Let's set:
        - For `0` select `AccountId32` from the scroll-down menu
        - For `id` input the address of the zkVerify account you want to receive the assets on zkVerify.

#### Assets

Let's set the `assets` parameter as follows:

![alt_text](./img/assets_para.png)

- For `assets: XcmVersionedMultiAsset` select `V5` from the scroll-down menu. Click on the `Add Item` button. New fields will pop-up. Let's set:
    - For `parents` input `1`
    - For `interior` select `Here` from the scroll-down menu. Then new fields will appear. Let's set:
        - For `fun` select `Fungible` from the scroll-down menu
        - For `fun` input the amount of assets you want to send. e.g. to send 1 VFY , remembering that the token has 18 decimals, it's: `1000000000000000000`.

#### Fee Asset Item

This is simply the index of the asset in the `assets` array that will be used to pay for the XCM teleport fee. We only have a single asset (VFY) and we are using that one, so we set it to `0`.

#### Submitting the extrinsic

Click on `submitTransaction` and then `sign And Submit` on the new window that will appear to conclude our teleport.

### From VFlow to zkVerify via EVM Tooling

We've included a precompile contract in VFlow that allows you to teleport VFY tokens to zkVerify directly from your standard EVM tools (like Metamask).
Contract is deployed at address `2060`. Here is an example script leveraging `web3` library:

```javascript
const { Web3 } = require('web3');

// Configuration
const RPC_URL = 'wss://vflow-volta-rpc.zkverify.io'; // VFlow RPC endpoint
const PRIVATE_KEY = ''; // Your Ethereum account private key
const PRECOMPILE_ADDRESS = '0x000000000000000000000000000000000000080C'; // XCM Teleport precompile address

// XCM Teleport precompile ABI
const teleportABI = [
  {
    name: 'teleportToRelayChain',
    type: 'function',
    inputs: [
      { name: 'destinationAccount', type: 'bytes32' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
];

async function testTeleport() {
  // Initialize Web3
  const web3 = new Web3(RPC_URL);

  // Add your account to the wallet
  const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
  web3.eth.accounts.wallet.add(account);

  console.log(`Using account: ${account.address}`);

  // Check balance
  const balance = await web3.eth.getBalance(account.address);
  console.log(`Account balance: ${web3.utils.fromWei(balance, 'ether')} tVFY`);

  // Set up the contract
  const contract = new web3.eth.Contract(teleportABI, PRECOMPILE_ADDRESS);

  // Test parameters
  const destinationAccount = ''; // 32-byte relay chain account
  const amount = web3.utils.toWei('1', 'ether'); // 1 VFY

  console.log(`Teleporting ${web3.utils.fromWei(amount, 'ether')} VFY`);
  console.log(`From: ${account.address} (parachain)`);
  console.log(`To: ${destinationAccount} (relay chain)`);

  // Estimate gas
  const gasEstimate = await contract.methods
    .teleportToRelayChain(destinationAccount, amount)
    .estimateGas({ from: account.address });

  console.log(`Estimated gas: ${gasEstimate}`);

  // Send transaction
  console.log('Sending transaction...');
  const result = await contract.methods
    .teleportToRelayChain(destinationAccount, amount)
    .send({
      from: account.address,
      gas: gasEstimate,
    });

  console.log('✅ Transaction successful!');
  console.log(`Transaction hash: ${result.transactionHash}`);
  console.log(`Block number: ${result.blockNumber}`);
  console.log(`Gas used: ${result.gasUsed}`);
}

testTeleport();

```

A couple of important notes:
- In this case, the `amount` to be sent, doesn't require to specify 18 decimals.
- The `destinationAccount` is an hex public key of zkVerify. While from PolkadotJS-UI you can use the AccountID and PolkadotJS automatically performs the conversion to the correct format, in this case you need to do it manually.
From [PolkadotJS](https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fzkverify-volta-rpc.zkverify.io#/explorer) navigate to `Developer-> Utilities` and select the `Convert Address` tab:

![alt_text](./img/convert_address.png)

Just copy paste the account id in the `address to convert` field to automatically get the public key to use as `destinationAccount`.

### Teleport via zkv-xcm-library
We've developed a Typescript library, called [zkv-xcm-library](https://github.com/zkVerify/zkv-xcm-library?tab=readme-ov-file#zkverify-xcm-library), in order to simplify the creation of such XCM teleport extrinsics and for ease of integration with your app/frontend.
Check the readme for installation and usage instructions.

### A Note on XCM Teleport Fees

Since an XCM message is executed both on the Relay Chain and Parachain side, both sender and receiver need to pay for execution fees. However:
- The fees charged to the sender **are deducted directly from its main balance**. This happens immediately when the transaction is included in a block, **before the teleport's burn logic is even executed**. So, if after fee deduction your remaining balance is not enough to cover the burn logic, the transaction will fail.
- The fees charged to the receiver **are deducted from the amount being teleported**. This happens when the XCM message is executed on the Parachain side.

### Deep-Dive: XCM Parameters Explanation

Let's provide a brief explanation here of the complex XCM message construction and parameters we've seen before:
- `dest` provides details about the destination of the message (we need to select the XCM version currently being used. V5 is the most-up-to-date at the time of writing).
    - `parents` tells the XCM executor that the following `interior` is relative to the chain itself. 

    - `interior` describes the rest of the path, the specific, step-by-step directions to the final destination. It defines a sequence of "hops" or _Junctions_. Each junction is a specific location or entity within a consensus system.
        - The interior is structured as a container, usually X1, X2, X3, etc. where X stands for the number of Junctions (hops) in the path.
            - Here: Equivalent to X0, no junctions.
            - X1: A path with one junction.
            - X2: A path with two junctions.
            - ...and so on, up to X8.

You could think of it like a File System where: 
- The root directory is the Relay Chain
- There are as many sub-directories as Parachains.
- In each directory there is a list of consensus entities (accounts, pallets, etc.) living in that Relay Chain/Parachain.

![alt_text](./img/fs_metaphor.png)

So setting `parents = 0` means it's the current location (in bash it would be `.`) while `parents = 1` means it's the parent location (in bash it would be `..`).

Setting `interior = X1 { Parachain: 3 }` means essentially specifying `./parachain_3`;
Instead setting `interior = X2 { Parachain: 3, AccountKey20: 0x111 }` means essentially specifying `./parachain_3/account_111`

Putting it all together, in this case, we are initiating the teleport from the Relay Chain (so `parents` is 0, since we are already on the Relay Chain) to the Parachain with id `1`, which is *one hop* away from the parent (so `interior` is `X1` with `Parachain` set to `1`).
