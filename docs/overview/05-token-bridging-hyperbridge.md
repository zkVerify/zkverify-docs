---
title: Token Bridging
---

## Native token tVFY bridging

Token bridging is a component offered by **Hyperbridge**. \
Currently native token tVFY can be teleported to **Ethereum Sepolia** and back as well. \
In the future more networks will be supported and this documentation will be updated, as a lot of the values presented are EVM network specific.

### 1. From zkVerify (Volta Testnet) to Ethereum (Sepolia Testnet)

From [PolkadotJS](https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fzkverify-volta-rpc.zkverify.io#/explorer) navigate to `Developer-> Extrinsics` and select the `tokenGateway` pallet and the `teleport` extrinsic.

This call is used to initialize a cross-chain asset transfer. Any provided assets are custodied by the pallet and a cross-chain request is dispatched to the destination supported chain.


#### 1.1 Parameters Definitions

- `assetId`: the local asset Id registered on Hyperbridge and that should be transferred.
- `destination`: Destination state machine that should receive the funds, defined by its chain type and chain id. 
- `recipient`: The beneficiary account for the funds on the destination.
- `amount`: The amount that should be transferred.
- `timeout`:The request timeout in seconds, this is the time after which the request cannot be delivered to the destination. It should represent the cumulative time for finalization on the source chain and Hyperbridge with some additional buffer. If 0 it never times out.
- `tokengateway`: The address of the token gateway module on the destination chain. 
- `relayer_fee`: The amount to be paid to relayers for delivering the request, a value of zero means the dispatcher is responsible for relaying the request. For now it's okay to leave it to 0.
- `redeem`: Boolean specifying if we are redeeming an existing ERC20. 

#### 1.2 Parameters Template

| Parameter      | Example Value                              | Customizable | Comments                                                                                                                                        |
|----------------|--------------------------------------------|--------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| `assetId`      | 0                                          | No           | native token tVFY asset Id is 0                                                                                                                 |
| `destination`  | Evm -> 11155111                            | No           | Ethereum Sepolia chain ID                                                                                                                            |
| `recipient`    | 0x000000000000000000000000[ADDRESS]        | Yes          | Address should be left padded with zeros to fit into the required 32 bytes. Copy paste the example + append your address (remove the 0x though) |
| `amount`       | 1000000000000000000                        | Yes          | tVFY token has 18 decimals                                                                                                                      |
| `timeout`      | 7200                                       | Yes          | Can be custom but recommend to put 7200 seconds (2 hours).                                                                                      |
| `tokengateway` | 0xFcDa26cA021d5535C3059547390E6cCd8De7acA6 | No           | Contract address for Ethereum Sepolia                                                                                                                |
| `relayer_fee`  | 0                                          | No           | 0 means the dispatcher is responsible for relaying the request, we can leave it as it is for now.                                               |
| `redeem`       | false                                      | No           | we will not deploy ERC20 on our own so always false.                                                                                            | 

#### 1.3 Parameters Template hex-encoded call

Instead of copying each value at a time from the previous you can decode a complete extrinsic example and only change the values you need.
For this purpose, go to `Developer -> Extrinsics -> Decode` and copy/paste the following hex

***0x5d000000000000a736aa000000000000000000000000006a88ce5345fdf2afef1d5dd26104696e9c3a3e8800008a5d784563010000000000000000000000000000000050fcda26ca021d5535c3059547390e6ccd8de7aca6000000000000000000000000000000000000***

Then click on the `Submission` tab and change the values you need. 

#### 1.4 Check results
When the tx succeeds, the extrinsic from zkVerify side looks like following https://polkadot.js.org/apps/#/explorer/query/0x12a55ba61173598626f29d3e17b297d2b1981686b0adeaa04564840aed99b7bd

And then from EVM Ethereum Sepolia side, this is the transaction we can expect https://sepolia.etherscan.io/tx/0x2eb78b880b1f11793ddeb792b42d6a0b97e6e840e5214bcf0865745c400dec43
Also, we can check the balance of EVM tVFY tokens of the recipient address to check it increased https://sepolia.etherscan.io/address/0x22d10f789847833607a28769cedd2778ebfba429#readContract

### 2. From Ethereum (Sepolia Testnet) to zkVerify (Volta Testnet)

#### 2.1 Prerequisites

Before starting to build our teleport call, we need to drip some Hyper USD tokens. This token is needed as it acts as fee token to teleport assets.

##### 2.1.1 Approve spender (Hyper USD)
First we need to approve the tokengateway contract as spender of Hyper USD tokens.
Go to https://sepolia.etherscan.io/address/0xa801da100bf16d07f668f4a49e1f71fc54d05177#writeContract
Connect your account you'll be using to teleport tokens from.

`approve` method 
- `spender` The tokengateway contract address ***0xFcDa26cA021d5535C3059547390E6cCd8De7acA6***
- `amount`: Max uint256 value ***115792089237316195423570985008687907853269984665640564039457584007913129639935***

##### 2.1.2 Drip Hyper USD tokens

Go to https://sepolia.etherscan.io/address/0x1794ab22388303ce9cb798be966eeebefe59c3a3#writeContract

`drip` write method. Connect your account you'll be using to teleport tokens from.
The only argument is token address, enter ***0xA801da100bF16D07F668F4A49E1f71fc54D05177*** which is the Hyper USD token address.
FYI, you need some Sepolia ETH tokens to pay the fees.

#### 2.2 Teleport your tokens
Go to the ***Tokengateway Ethereum sepolia contract***

https://sepolia.etherscan.io/address/0xFcDa26cA021d5535C3059547390E6cCd8De7acA6#writeContract

Teleporting tokens back to zkVerify is done through the write method `teleport`.

#### 2.3 Parameters Definitions
- ***Note:*** There's a top-level parameter, `teleport`: [payableAmount(ether)]. Enter 0 here. 
- `amount`: amount to be sent, in wei unit of ether (18 decimals)
- `relayerFee`: The amount to be paid to relayers for delivering the request.
- `assetId`: this is the bytes32 representation of the token symbol of the source EVM token.
- `redeem`: Redeem ERC20 on the destination?
- `to` ->  This is the destination address receiving the tokens.
- `dest`: This is the bytes representation of the destination chain, in this case zkVerify.
- `timeout`: The request timeout in seconds, this is the time after which the request cannot be delivered to the destination. It should represent the cumulative time for finalization on the source chain and Hyperbridge with some additional buffer. If 0 it never times out.
- `nativeCost`: Amount of native token to pay for dispatching the request. If 0 will use the `IIsmpHost.feeToken`
- `data`: Destination contract call data

#### 2.4 Parameters Template

| Parameter    | Example Value                                                      | Customizable | Comments                                                                                        |
|--------------|--------------------------------------------------------------------|--------------|-------------------------------------------------------------------------------------------------|
| `amount`     | 100000000000000000                                                 | Yes          | tVFY EVM Sepolia token has 18 decimals                                                          |
| `relayerFee` | 0                                                                  | No           |                                                                                                 |
| `assetId`    | 0xbce67a4632d733ff3d4599502fc9c8812688ce39220e4304bd7b43c22ae5c77c | No           | bytes32 representation of the tVFY EVM token (check following section to see how it's computed) |
| `redeem`     | false                                                              | No           | We'll never redeem an ERC-20 on the destination chain                                           |
| `to`         | 0xa23ab6a920b139595c75b86d04b81f4508146e8a5fe756de9f04de9c64e23845 | Yes          | Need to be given in public key hex format (check following section to see how it's computed)    |
| `dest`       | 0x5355425354524154452d7a6b765f                                     | No           | bytes representation of the destination chain, zkVerify (check following section to see how it's computed)                                        |
| `timeout`    | 7200                                                               | Yes          | Can be custom but recommend to put 7200 seconds (2 hours).                           |
| `nativeCost` | 0                                                                  | No           |                                                                                                 |
| `data`       | 0x                                                                 | No           |                                                                                                 | 


#### 2.5 Parameter computation
##### `assetId`
This is calculated by executing the following solidity operation

```solidity
keccak256(bytes("tVFY"));
```

In this case, the result is ***0xbce67a4632d733ff3d4599502fc9c8812688ce39220e4304bd7b43c22ae5c77c***

##### `to`

This param has to be given in public hex format. To convert your SS58 address to public hex key address.
First install [Subkey CLI](https://paritytech.github.io/polkadot-sdk/master/subkey/index.html): 

```cargo install subkey --locked```

Next, for the example zkVerify address (xpisMVzVEZnbYfz5QfFhKUQVPD2L6TdZRVxnmZG2YBKTmEPq5), run the following command to get the Public key (hex):

```bash
subkey inspect xpisMVzVEZnbYfz5QfFhKUQVPD2L6TdZRVxnmZG2YBKTmEPq5

Public Key URI `xpisMVzVEZnbYfz5QfFhKUQVPD2L6TdZRVxnmZG2YBKTmEPq5` is account:
  Network ID/Version: 251
  Public key (hex):   0xa23ab6a920b139595c75b86d04b81f4508146e8a5fe756de9f04de9c64e23845
  Account ID:         0xa23ab6a920b139595c75b86d04b81f4508146e8a5fe756de9f04de9c64e23845
  Public key (SS58):  xpisMVzVEZnbYfz5QfFhKUQVPD2L6TdZRVxnmZG2YBKTmEPq5
  SS58 Address:       xpisMVzVEZnbYfz5QfFhKUQVPD2L6TdZRVxnmZG2YBKTmEPq5
```

In this case, the public hex key for this address is 0xa23ab6a920b139595c75b86d04b81f4508146e8a5fe756de9f04de9c64e23845


##### `dest`
This is calculated by executing the following solidity operation 

```solidity
bytes4 id = bytes4(bytes("zkv_"));
return bytes(string.concat("SUBSTRATE-", string(abi.encodePacked(id))));
```

In this case, zkVerify bytes representation is ***0x5355425354524154452d7a6b765f***

#### 2.6 Check results

When the tx succeeds, the transaction from EVM side looks like following https://sepolia.etherscan.io/tx/0x3112a43a76019ae77fee56d7721a3fface395ae70d014affe3d17792d16ed3f1

And then from zkVerify side, these are the extrinsics and events
https://polkadot.js.org/apps/#/explorer/query/0x3637c0ac9b082396a62232e24412aa492f75da71d66bd19fd5d62c7d6e66c374
