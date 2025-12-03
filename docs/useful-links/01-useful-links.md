---
title: Move VFY from zkVerify to Base
---

## How do I move VFY from zkVerify to Base?

Follow these steps end-to-end. You will first teleport VFY from the zkVerify relay chain to VFlow (zkVerify’s EVM parachain), then bridge from VFlow to Base using Stargate.

1) Connect a wallet to VFlow

- Read and follow: [Connect to VFlow](https://docs.zkverify.io/architecture/VFlow/connect-a-wallet)
- Ensure your wallet (e.g., SubWallet/Talisman + EVM account) is ready to interact with Polkadot-JS and VFlow.
- If the network isn’t listed, manually add the mainnet RPC endpoint from the connection guide linked above.

![Select EVM address in Polkadot-JS](../architecture/08-VFlow/03-VFY-Bridging/img/select_EVM_address.png)

Prerequisite: two addresses connected in Polkadot-JS UI

- A Substrate address on zkVerify Mainnet (format starting with `ZK*****`).
- An EVM address for VFlow. Some wallets offer unified-account functionality, which may show them as a single account, but they are distinct under the hood.

2) Teleport VFY from zkVerify to VFlow (Polkadot-JS UI)

- Reference (full walkthrough): [Teleport Token across zkVerify Parachains → From zkVerify to VFlow via PolkadotJS-UI](https://docs.zkverify.io/architecture/VFlow/VFY-Bridging/token-teleport#from-zkverify-to-vflow-via-polkadotjs-ui)

- Quick method via Decode (recommended)
  - In Polkadot-JS, go to Developer → Extrinsics → Decode
  - Paste the following hex: 

    ```
    0x8c0105000100040500010300000000000000000000000000000000000000000005040000000000000000
    ```

  - Switch to Submission
  - Change only these parameters:
    - Beneficiary → V5 → X1 → AccountKey20 → key: set your EVM address on VFlow (20 bytes)
    - Assets → V5 → 0 → fun → Fungible: set the VFY amount (18 decimals; e.g., 1 VFY = 1000000000000000000)
  - Submit and sign the transaction

3) Bridge from VFlow to Base via Stargate

- After the teleport finalizes and your VFY appears on VFlow, use Stargate to bridge to Base:
  - Open: [Stargate prefilled link](https://stargate.finance/bridge?srcChain=zkverify&srcToken=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&dstChain=base&dstToken=0xa749dE6c28262B7ffbc5De27dC845DD7eCD2b358)
  - Ensure the source chain is zkVerify (VFlow EVM) and destination is Base
  - Select the amount of VFY and proceed with the bridge

Notes and tips

- Amounts on the teleport step use 18 decimals; ensure you have enough balance to cover XCM execution fees. Receiver-side XCM fees are deducted from the teleported amount.
- If you need deeper context on XCM teleport parameters, see the official explanation in the same guide linked above.
- For wallet setup and troubleshooting, use the wallet connection guide first, then retry the teleport.
