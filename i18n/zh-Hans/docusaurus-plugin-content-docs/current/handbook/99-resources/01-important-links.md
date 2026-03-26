---
title: 资源
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

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

## RPC 访问

### Ankr（推荐）

为了获得更稳定的连接和更高的速率限制，建议使用带 API key 的 Ankr：


<Tabs groupId="ankr">
<TabItem value="mainnet" label="Mainnet">
- 注册免费账户并获取 API key：[Ankr zkVerify chain page](https://www.ankr.com/web3-api/chains-list/zkverify/[API_KEY])
- WebSocket: `wss://rpc.ankr.com/zkverify_mainnet/ws/[API_KEY]`
- HTTPS: `https://rpc.ankr.com/zkverify_mainnet/[API_KEY]`
</TabItem>
<TabItem value="testnet" label="Testnet">
- 注册免费账户并获取 API key：[Ankr zkVerify chain page](https://www.ankr.com/web3-api/chains-list/zkverify/)
- WebSocket: `wss://rpc.ankr.com/zkverify_volta_testnet/ws/[API_KEY]`
- HTTPS: `https://rpc.ankr.com/zkverify_volta_testnet/[API_KEY]`
</TabItem>
</Tabs>


如果不使用 API key，可能会遇到更低的速率限制。

### 公共端点（无 API key）

以下端点无需 API key 即可使用：

<Tabs groupId="networks">
<TabItem value="mainnet" label="Mainnet">
- WebSocket: wss://zkverify-rpc.zkverify.io
- HTTPS: https://zkverify-rpc.zkverify.io
</TabItem>
<TabItem value="testnet" label="Testnet">
- WebSocket: wss://zkverify-volta-rpc.zkverify.io
- HTTPS: https://zkverify-volta-rpc.zkverify.io
</TabItem>
</Tabs>
