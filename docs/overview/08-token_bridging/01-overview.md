---
title: Overview
---

## Native token tVFY bridging

Token bridging is a component offered by Hyperbridge.
Currently native token tVFY can be teleported to Ethereum Sepolia.

`teleport` is an extrinsic of the pallet token gateway.

This call is used to initialize a cross-chain asset transfer. Any provided assets are custodied by the pallet and a cross-chain request is dispatched to the destination supported chain.

The extrinsic can be called by any account and expects the following input params

- `assetId`: the local asset Id registered on Hyperbridge and that should be transferred, for the native token this is 0
- `destination`: Destination state machine that should receive the funds, defined by its chain type and chain id
- `recipient`: The beneficiary account for the funds on the destination. (For EVM chains, the address should be left padded with zeros to fit into the required 32 bytes.)
- `amount`: The amount that should be transferred.
- `timeout`:The request timeout, this is the time after which the request cannot be delivered to the destination. It should represent the cumulative time for finalization on the source chain and hyperbridge with some additional buffer. If 0, it means it never times out.
- `tokengateway`: The address of the token gateway module on the destination chain. Addresses can be found here (currently only Ethereum Sepolia is supported) https://docs.hyperbridge.network/developers/evm/contracts/testnet
https://docs.hyperbridge.network/developers/evm/contracts/mainnet
- `relayer_fee`: The amount to be paid to relayers for delivering the request, a value of zero means the dispatcher is responsible for relaying the request
- `redeem`: Always false, we will not deploy ERC20 on our own.




