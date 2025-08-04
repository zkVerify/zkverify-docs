# Connect to VFlow

To interact with VFlow, you’ll need to connect your wallet (we’ll use MetaMask in this example) and manually add the VFlow network using the provided RPC endpoint and chain details.

## Step 1: Install MetaMask

If you don’t have MetaMask installed yet, download it from the official site, and follow the instructions to set up your wallet.

## Step 2: Add the VFlow Network to MetaMask

Once MetaMask is installed:

1. Open MetaMask and click on the network dropdown (usually says “Ethereum Mainnet” by default).
2. Select “Add network” or “Add network manually”.
3. Fill in the following VFlow network details:

| Field                | Value                           |
|----------------------|---------------------------------|
| **Network Name**     | VFlow                           |
| **RPC URL**          | https://vflow-rpc.zkverify.io   |
| **Chain ID**         | 1409                            |
| **Currency Symbol**  | VFLOW (optional)                |
| **Block Explorer URL** | (optional) leave blank         |

4. Click “Save” to add the network.

You’re now connected to the VFlow chain!

## Step 3: Verify Connection

To confirm you're connected:

- Switch to the VFlow network in MetaMask.
- Open the browser console or your dApp’s UI and check the current chain ID: it should return `0x585` (which is 1409 in hex).

## What’s Next?

Once connected, you can interact with VFlow-based applications, sign transactions, and query data using the VFlow RPC endpoint.