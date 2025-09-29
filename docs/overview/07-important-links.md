---
title: Resources
---

| Product                                                     | Link                                                                                                                                                                                                             |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Github                                                      | https://github.com/zkVerify/zkVerify                                                                                                                                                                             |
| zkVerifyJS                                                  | https://www.npmjs.com/package/zkverifyjs                                                                                                                                                                         |
| zkVerify Block Explorer                                     | https://zkverify.subscan.io                                                                                                                                                                            |
| zkVerify Testnet Block Explorer                                     | https://zkverify-testnet.subscan.io/                                                                                                                                                                             |
| Monitoring                                                  | https://telemetry.zkverify.io/                                                                                                                                                                                   |
| Documentation                                               | https://docs.zkverify.io                                                                                                                                                                                         |
| zkVerify Proof Explorer                                     | https://proofs.zkverify.io/                                                                                                                                                                                      |
| Proof Submission via PolkadotJS                             | [polkadotjs](https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fzkverify-volta-rpc.zkverify.io%2Fwss#/explorer)                                                                                                              |

## RPC Access

### Ankr (recommended)

For best reliability and higher rate limits, use Ankr with an API key:

- Create a free account and get an API key: [Ankr zkVerify chain page](https://www.ankr.com/web3-api/chains-list/zkverify/)
- WebSocket: `wss://rpc.ankr.com/zkverify_volta_testnet/ws/[API_KEY]`
- HTTPS: `https://rpc.ankr.com/zkverify_volta_testnet/[API_KEY]`

Without an API key, you may experience lower rate limits.

### Public endpoints (no API key)

These endpoints are available without an API key:

- WebSocket: wss://zkverify-volta-rpc.zkverify.io
- HTTPS: https://zkverify-volta-rpc.zkverify.io