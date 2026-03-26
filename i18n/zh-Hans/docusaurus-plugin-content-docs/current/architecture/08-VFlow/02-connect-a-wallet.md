---
title: 连接 VFlow
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

与 VFlow 交互需要连接钱包。推荐使用 **SubWallet**（首选）或 **Talisman**，两者均支持 EVM 与 Substrate 链。

:::info Wallet Setup
关于钱包安装与设置，请参考 [Connect a Wallet 指南](https://docs.zkverify.io/architecture/VFlow/connect-a-wallet)。
:::

:::important MetaMask User? 
如果你的主 EVM 钱包在 MetaMask，需要导出助记词并导入 SubWallet 或 Talisman，这样才能同时连接 EVM 与 Substrate 链，保证跨链类型访问同一钱包。
:::

### Finding VFlow in Your Wallet

在 SubWallet 或 Talisman 复制 Substrate 地址时会弹出网络列表，搜索 “VFlow” 即可快速选择。

## 在 Polkadot.js 哪里查看账户？

在 Polkadot.js 查看账户有两种方式：

1. **直接访问**：[使用 VFlow 的 Polkadot.js Apps](https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fvflow-rpc.zkverify.io#/accounts)
2. **手动切换**：  
   - 打开 Polkadot.js 侧栏  
   - 在网络列表找到 “VFlow”  
   - 点击 “Switch” 连接 VFlow

连接后在顶部进入 **Accounts > Account**。可看到与你在 SubWallet 或 Talisman 扩展中一致的 EVM 地址。

:::warning Important Account Note
可能会看到 Polkadot.js 自动生成的另一个 EVM 地址，**请勿向该地址转账**。只使用浏览器扩展钱包（SubWallet 或 Talisman）显示的地址。
:::
