---
title: Connect a Wallet
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Connect a Wallet

## Recommended Wallets

### SubWallet

A comprehensive Polkadot, Substrate and Ethereum wallet.
SubWallet is a versatile option for managing assets across over 150 networks. With support for hardware wallets, light clients and MetaMask compatibility, it caters to a wide range of user preferences and needs.

https://www.subwallet.app/

### Talisman

Talisman provides a secure and user-friendly platform for managing assets, interacting with dApps, and exploring both the Polkadot and Ethereum ecosystems. With support for a variety of networks, NFT management, and hardware wallets, Talisman presents itself as a holistic wallet solution.

https://www.talisman.xyz/

## Connecting to zkVerify Mainnet/Testnet through Polkadot-JS

This section will walk you through connecting to the zkVerify Mainnet or Testnet using the [Polkadot-JS](https://polkadot.js.org/apps/#/explorer) web interface.

### Substrate-based Wallets

Substrate wallets are designed to work natively with zkVerify and other Substrate-based chains. They provide the most comprehensive support for features like staking, governance, and managing multiple accounts.

#### SubWallet

1.  **Install SubWallet**: Get the SubWallet browser extension from the [official SubWallet website](https://subwallet.app/).
2.  **Create or Import an Account**: Set up your wallet by creating a new account or importing one with an existing seed phrase.
3.  **Connect to Polkadot-JS**:
      * Go to the [Polkadot-JS interface](https://polkadot.js.org/apps/#/explorer).
      * A SubWallet pop-up will appear, requesting authorization to connect.
      * Click on the account(s) you'd like to connect
      * Click `Approve` / `Connect`  to grant access.
4.  **Verify Connection**: Your accounts will now be visible in the `Accounts` tab within, identified by the "SUBWALLET-JS" tag.

To connect to the zkVerify Mainnet / Testnet: 
1.  Click the current network logo (Polkadot by deafult) in the top-left corner of the screen to open the sidebar.
2.  Find `zkVerify` in the list and click on it.
3.  Then, click the `Switch` button at the top of the sidebar: the interface will reload and connect to the selected network.

### EVM-based Wallets

<u>IMPORTANT: Metamask is NOT for native Substrate use.</u> EVM-only wallets like Metamask **cannot** be used to interact with the native features of the Polkadot-JS interface. We **strongly advise** using a dedicated multi-chain wallet like **SubWallet** (or Talisman). These wallets are fully compatible with both Substrate-based and EVM-compatible chains, providing a single, seamless solution for all your interactions.

Your EVM address (e.g. `0x...`) is a different format from your native Substrate address (e.g. `5...` or `xp...`), and can be displayed by clicking the `Accounts` tab, when connected to EVM-compatible parachains (such as VFlow).

**Note**: If you've connected your wallet but your accounts aren't showing up, try these steps:

- **Refresh**: A simple browser refresh often solves the issue.
- **Check Wallet Permissionss**: Open your wallet extension and ensure it has permission to connect to the Polkadot-JS site.
- **Switch Networks**: Try switching to another network in Polkadot-JS and then switching back to zkVerify. This can sometimes force the interface to re-check for accounts.

## Connecting to zkVerify Network

Below are the zkVerify RPC URL and zkVerify Explorer URL for both mainnet and testnet that will be used to configure the wallet connection, allowing you to interact with blockchain using recommended browser wallets:

<Tabs groupId="networks">
<TabItem value="mainnet" label="Mainnet">
| <!-- -->                  | <!-- -->                             |
| ------------------------- | ------------------------------------ |
| zkVerify RPC URL  | wss://zkverify-rpc.zkverify.io        |
| zkVerify Explorer | https://zkverify.subscan.io |
</TabItem>
<TabItem value="testnet" label="Testnet">
| <!-- -->                  | <!-- -->                             |
| ------------------------- | ------------------------------------ |
| zkVerify Testnet RPC URL  | wss://zkverify-volta-rpc.zkverify.io        |
| zkVerify Testnet Explorer | https://zkverify-testnet.subscan.io/ |
</TabItem>
</Tabs>

Follow the instructions below to set up your wallet with these variables and start exploring the zkVerify Testnet blockchain.

### Using Talisman

1. Go to Settings.
2. Select Network & Tokens.
3. Choose Manage Networks.
4. Find and click on Polkadot.
5. Search for "zkVerify Testnet" and activate using the toggle.

![](./img/talisman-add-network.png)

### Using SubWallet

1. Go to Settings (top left icon).
2. Choose Manage Networks.
3. Search for "zkVerify Testnet" in the list.
4. Click on the corresponding button to enable it.

![](./img/subwallet-add-network.png)

## Get $tVFY zkVerify Testnet Tokens

Head on over to our [Testnet Faucet](https://zkverify-faucet.zkverify.io/), submit your email address and Wallet Address and you will receive $tVFY within 24 hours.

Thank you for testing! If you have any questions or require support from the team, feel free to reach out to us on [Discord](https://discord.gg/zkverify).
