---
title: "zkP2P"
sidebar_position: 6
---

# 本地安装 zkp2p

如果你想从和这篇说明完全一致的代码开始，可以直接使用 [zkp2p-demo](https://github.com/JetHalo/zkp2p-demo) 这个仓库。

## 这个项目是做什么的

`zkp2p` 可以把它理解成一个 OTC 工具。买家先用真实银行转账给卖家付款，前端和插件负责把“这笔钱确实付了”这件事变成可验证的证明，等证明通过之后，链上再按这个证明把之前锁住的质押金放出来。

这个 demo 里，真实付款记录来自 Wise 页面; 浏览器扩展负责采集和 proving; 服务端负责验真和转发 proof; 最后由合约根据聚合结果执行 release。

## 它大概分成哪几部分

从工程结构上看，本地启动时主要会接触下面这几块:

- `apps/web`: OTC 页面本体，同时提供 `/api/submit-proof`、`/api/proof-status`、`/api/proof-aggregation` 和 `/api/verify-wise-attestation`
- `apps/proof-plugin`: 浏览器插件，负责拉起采集、触发 proving、提交 proof 和轮询状态
- `apps/tlsn-verifier`: 服务端 verifier，负责确认这份 Wise attestation 是真的，并产出 `wiseReceiptHash`
- `apps/tlsn-wise-plugin` 和 `apps/tlsn-wasm-host`: Wise 对应的 TLSN wasm 插件文件和它的静态托管

除此之外，还要有一个已经部署好的 `Zkp2pDepositPool` 合约和对应的子图，用来承接链上 release 和读取链上状态。

## 准备工作

开始之前，请先准备好下面这些条件:

- Node.js 20 或更高版本
- npm
- Chrome 或 Edge，并且可以开启 `Developer mode`
- 一组可用的 Kurier 配置: `KURIER_API_URL`、`KURIER_API_KEY`、`KURIER_VK_HASH`、`KURIER_AGGREGATION_DOMAIN_ID`
- 一个已经部署好的 `Zkp2pDepositPool` 合约地址
- 一个可用的 Goldsky / The Graph 子图地址，供卖家流动性和 commitments 查询使用

下面这些是可选项:

- Foundry: 如果你要在本地跑合约测试或重新部署合约
- Noir / `nargo`: 如果你要重新编译电路
- Docker: 如果你想把 TLSN wasm 用容器方式托管

## 安装仓库

### 1. Clone the repository

先把代码拉下来:

```bash
git clone https://github.com/JetHalo/zkp2p-demo.git
cd zkp2p-demo
```

### 2. Install workspace dependencies

这个仓库用了 npm workspaces，所以在根目录安装一次依赖即可:

```bash
npm install
```

这会同时安装 `apps/web`、`apps/proof-plugin` 和 `apps/tlsn-verifier` 需要的依赖。扩展本身是静态文件，不需要额外 build。

## 启动配套服务

### 1. Start `tlsn-verifier`

先把 verifier 跑起来:

```bash
cd apps/tlsn-verifier
PORT=8080 \
CORS_ALLOW_ORIGIN=http://localhost:3011 \
npm run dev
```

预期输出如下:

```text
[tlsn-verifier] listening on :8080
```

这里补充两点:

- 仓库里虽然有 `apps/tlsn-verifier/.env.example`，但当前服务代码不会自动读取 `.env` 文件。那份文件更适合当字段参考，或者给你自己的进程管理器使用。
- verifier 的职责是验真，不负责 proving。它只返回规范化后的转账字段和 `wiseReceiptHash`，不会替浏览器生成 proof。

你可以用下面这个请求先确认服务起来了:

```bash
curl -sS http://localhost:8080/health
```

预期返回:

```json
{"ok":true,"service":"tlsn-verifier"}
```

### 2. Expose the Wise TLSN wasm

项目里已经带了一份可直接使用的 `wise_plugin.tlsn.wasm`，本地可以先把它作为静态文件暴露出来:

```bash
cd apps/tlsn-wasm-host
python3 -m http.server 8090
```

跑起来以后，这个地址应该可以访问:

```text
http://localhost:8090/wise_plugin.tlsn.wasm
```

这里单独暴露 wasm，是因为 `proof-plugin` 负责 orchestration，而和 Wise 页面交互、生成 TLS attestation 的逻辑在 TLSN 插件 wasm 里。把它拆出来单独托管，后续更新采集规则时会更稳，也更容易替换。

### 3. Optional: rebuild the Wise TLSN artifact

如果当前目标只是先把项目跑通，这一节可以略过，直接使用 `apps/tlsn-wasm-host` 里现成的 wasm。

如果你要自己修改 Wise 侧的采集规则，再去处理 `apps/tlsn-wise-plugin`:

```bash
cd apps/tlsn-wise-plugin
bash ./scripts/bootstrap-boilerplate.sh
```

这一步会拉取 TLSNotary 的 boilerplate，并套上当前仓库的 Wise 配置骨架。完成后需要产出你自己的 `wise.plugin.wasm`，再把它放到一个可访问的 URL，并写回 `NEXT_PUBLIC_TLSN_WISE_PLUGIN_URL`。

## 配置 Web 应用

### 1. Create `apps/web/.env.local`

这个仓库目前没有现成的 `apps/web/.env.local.example`，所以这里需要手动创建 `apps/web/.env.local`。

```dotenv
NEXT_PUBLIC_CHAIN_ID=<your_horizen_chain_id>
NEXT_PUBLIC_CONTRACT_ADDRESS=0x<your_deposit_pool_address>
NEXT_PUBLIC_BUSINESS_DOMAIN=zkp2p-horizen
NEXT_PUBLIC_TLSN_WISE_PLUGIN_URL=http://localhost:8090/wise_plugin.tlsn.wasm
NEXT_PUBLIC_INTENT_TTL_SECONDS=1800

KURIER_API_URL=https://<your-kurier-api-base>
KURIER_API_KEY=<your_kurier_api_key>
KURIER_API_ID=zkp2p
KURIER_AGGREGATION_DOMAIN_ID=175
KURIER_VK_HASH=0x<vk_hash_from_register_vk>
KURIER_PROOF_VARIANT=Plain

THEGRAPH_SUBGRAPH_URL=https://api.goldsky.com/api/public/<project_id>/subgraphs/<name>/<version>/gn
TLSN_VERIFIER_URL=http://localhost:8080/verify-wise-attestation
TLSN_ALLOWED_HOST_SUFFIXES=wise.com,transferwise.com
RPC_URL=https://horizen-testnet.rpc.caldera.xyz/http
```

下面四组变量最容易混淆:

- `NEXT_PUBLIC_TLSN_WISE_PLUGIN_URL` 是给浏览器看的，它告诉扩展去哪里拉 Wise TLSN wasm。
- `TLSN_VERIFIER_URL` 是给 Web 服务端看的，`/api/verify-wise-attestation` 会把请求转发到这里。通常建议走这条代理路径，而不是让浏览器直接访问 verifier。
- `KURIER_API_KEY` 和 `KURIER_VK_HASH` 都应该只留在服务端环境里，不能写进扩展，也不能塞进前端公开配置。
- `THEGRAPH_SUBGRAPH_URL` 会被 seller 和 commitments 相关接口使用。`/api/commitments` 没配时还能回退到 sqlite，但 `/api/sellers` 会直接报错，所以要跑完整的 seller / buyer 页面，最好一开始就配上。

如果你还没有子图地址，建议先把 Goldsky 的 subgraph 部署流程整理好再继续。如果你还想进一步梳理环境变量边界，也可以单独补一份 env boundary 和 env schema 说明，避免浏览器、服务端和插件配置混在一起。

### 2. Register the verification key and capture `vkHash`

上面的 `.env.local` 里可以先把 `KURIER_VK_HASH` 留成占位值，因为这一步还没有生成它。

这个项目已经把电路编译产物提交进仓库，所以 VK 注册不需要额外脚本。当前项目使用的是:

- proof system: `ultrahonk`
- public inputs 数量: `10`
- VK 文件: `circuits/zkp2p-horizen-release/noir/target/vk`

先把本地的 VK 文件转成 base64，避免直接把二进制写进 JSON:

```bash
VK_BASE64="$(base64 < circuits/zkp2p-horizen-release/noir/target/vk | tr -d '\n')"
```

然后调用 Kurier 的 VK 注册接口，并把返回结果暂存下来:

```bash
curl -sS -X POST "$KURIER_API_URL/register-vk/$KURIER_API_KEY" \
  -H 'content-type: application/json' \
  --data "{
    \"proofType\": \"ultrahonk\",
    \"vk\": \"${VK_BASE64}\",
    \"proofOptions\": {
      \"numberOfPublicInputs\": 10
    }
  }" | tee /tmp/zkp2p-vk.json
```

如果注册成功，返回里应该能看到 `vkHash` 或 `meta.vkHash`。把它提取出来:

```bash
jq -r '.vkHash // .meta.vkHash' /tmp/zkp2p-vk.json
```

然后把这个值写回 `apps/web/.env.local` 的 `KURIER_VK_HASH`。

这里有两个需要对齐的点:

- `numberOfPublicInputs` 这里填 `10`，对应的是当前电路的公开输入数量: `business_domain`、`app_id`、`user_addr`、`chain_id`、`timestamp`、`intent_id`、`amount`、`wise_receipt_hash`、`nullifier`、`statement`。
- `KURIER_PROOF_VARIANT` 必须和后面提交 proof 时使用的证明风格保持一致。如果你的 Kurier 环境要求切到 `ZK`，就把注册、出 proof 和提交三处一起切，不要只改其中一个。

如果这一步报 `proofOptions Required`、`INVALID_SUBMISSION_MODE_ERROR` 或 `vk` 相关错误，可以先检查:

- `KURIER_API_URL` 是否真的指向你当前用的 Kurier 环境
- `proofType` 是否和当前 case 的 `ultrahonk` 一致
- `numberOfPublicInputs` 是否仍然和电路公开输入数量一致

### 3. Start the web app

回到仓库根目录，启动 Next.js:

```bash
npm run dev:web
```

默认会跑在 `http://localhost:3011`。

这个页面第一次打开时，还会在 dApp 运行时里安装 `window.__ZKP2P_NOIR_PROVER__`。扩展发起 proving 时，会让当前 dApp 页去加载 `apps/web/pages/api/circuit-artifact.ts` 提供的 Noir artifact，再在浏览器端生成 `proof` 和 `publicInputs`。

你可以先用下面这个地址确认 artifact 能被正常读取:

```bash
curl -sS "http://localhost:3011/api/circuit-artifact?name=zkp2p_horizen_release"
```

如果这个接口能返回 JSON，说明浏览器 prover 所需的电路产物已经接上了。因为仓库里已经提交了 `circuits/zkp2p-horizen-release/noir/target/zkp2p_horizen_release.json`，第一次本地启动不用先跑 `nargo build`。

## 加载 Proof 插件

### 1. Load the unpacked extension

打开 `chrome://extensions` 或 `edge://extensions`，然后:

1. 打开 `Developer mode`
2. 点击 `Load unpacked`
3. 选择 `apps/proof-plugin`
4. 回到 `http://localhost:3011` 并刷新页面

这个扩展不需要额外 build。目录里的 `manifest.json`、`background.js`、`popup.js` 和 `inpage-bridge.js` 已经是可直接加载的开发形态。

### 2. Verify the extension can talk to the dApp

刷新页面之后，dApp 和扩展之间的桥接应该已经建立起来了。这里的原理是:

- `inpage-bridge.js` 会把扩展能力挂到 `window.zkp2pProofPlugin`
- dApp 调 `startProof(...)` 之后，扩展在后台维护 proof session
- 到 proving 这一步时，扩展再回到当前 dApp 页，调用已经安装好的 `__ZKP2P_NOIR_PROVER__`

因此:

- proving 仍然发生在浏览器端，不需要把 witness 发到服务端
- 扩展不需要单独携带完整的 Noir runtime，而是复用 dApp 已经准备好的 prover 环境

## 可选: 准备合约和链上工具

如果当前只需要把 Web、插件和 verifier 跑起来，这一节可以先跳过。

### 1. Prepare deployment variables

如果你要测试或部署合约，先准备一份 `contracts/.env` 作为变量清单:

```dotenv
RPC_URL=https://horizen-testnet.rpc.caldera.xyz/http
PRIVATE_KEY=0x<your_private_key>
USDC_ADDRESS=0x<existing_usdc_or_leave_blank_for_usdch>
GATEWAY_ADDRESS=0x<zkverify_aggregation_gateway_proxy>
DEPOSIT_POOL_ADDRESS=
```

这个仓库当前没有现成的 `forge script` 部署脚本，所以这里直接使用 `forge create`。`GATEWAY_ADDRESS` 指的是目标链上已经存在的 zkVerify aggregation gateway / proxy 地址，这个仓库不会把它一并部署出来。

如果你把变量写进了 `contracts/.env`，记得先导出到当前 shell:

```bash
cd contracts
set -a
source .env
set +a
```

再从私钥反推出本次部署地址，后面部署 `USDCH` 会用到:

```bash
export DEPLOYER_ADDRESS="$(cast wallet address "$PRIVATE_KEY")"
echo "$DEPLOYER_ADDRESS"
```

### 2. Run contract tests first

```bash
forge test
```

建议先跑测试。这个仓库的链上核心约束都在 `contracts/test/Zkp2pDepositPool.t.sol` 里，比如 buyer 绑定、nullifier 防重放、deadline 和 gateway 校验。先跑一遍，可以在部署前把明显问题暴露出来。

### 3. Deploy `USDCH` only if you need the demo token

如果目标链上已经有你要用的 6 位小数 USDC，直接把地址填进 `USDC_ADDRESS` 即可，可以跳过这一步。

如果你想沿用仓库里的演示 token，再部署 `USDCH`:

```bash
forge create src/USDCH.sol:USDCH \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast \
  --constructor-args "$DEPLOYER_ADDRESS"
```

部署成功后，把输出里的 deployed address 记下来，并导出成环境变量:

```bash
export USDC_ADDRESS=0x<deployed_usdch_address>
```

### 4. Deploy `Zkp2pDepositPool`

`Zkp2pDepositPool` 的构造参数只有两个:

- `token_`: 你上一步准备好的 USDC / USDCH 地址
- `gateway_`: 目标链上的 zkVerify aggregation gateway / proxy 地址

部署命令如下:

```bash
forge create src/Zkp2pDepositPool.sol:Zkp2pDepositPool \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast \
  --constructor-args "$USDC_ADDRESS" "$GATEWAY_ADDRESS"
```

部署成功后，把池子地址导出出来，后面 Web 和子图都要用:

```bash
export DEPOSIT_POOL_ADDRESS=0x<deployed_pool_address>
```

### 5. Verify the deployment before wiring the frontend

部署完成后，建议先用 `cast call` 做一次基础检查，再回填前端:

```bash
cast call "$DEPOSIT_POOL_ADDRESS" "token()(address)" --rpc-url "$RPC_URL"
cast call "$DEPOSIT_POOL_ADDRESS" "gateway()(address)" --rpc-url "$RPC_URL"
cast call "$DEPOSIT_POOL_ADDRESS" "totalDeposited()(uint256)" --rpc-url "$RPC_URL"
```

如果前两个返回的地址分别就是你的 `USDC_ADDRESS` 和 `GATEWAY_ADDRESS`，说明构造参数没有填错。

如果你部署的是仓库里的 `USDCH`，还可以再做一笔最小的 approve + deposit 烟雾测试:

```bash
cast send "$USDC_ADDRESS" "approve(address,uint256)" "$DEPOSIT_POOL_ADDRESS" 100000000 \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY"

cast send "$DEPOSIT_POOL_ADDRESS" "deposit(uint256)" 100000000 \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY"
```

这里的 `100000000` 对应 `100` 枚 6 位小数 token。approve 和 deposit 都成功之后，再把下面这些值回填到应用层:

- `apps/web/.env.local` 里的 `NEXT_PUBLIC_CONTRACT_ADDRESS`
- `contracts/.env` 里的 `DEPOSIT_POOL_ADDRESS`
- 子图部署命令里的 `DEPOSIT_POOL_ADDRESS`

如果你接下来要继续部署子图，可以直接沿用仓库已有的命令:

```bash
cd ../scripts/zkp2p-horizen-release/thegraph
DEPOSIT_POOL_ADDRESS="$DEPOSIT_POOL_ADDRESS" \
DEPOSIT_POOL_START_BLOCK=<deploy_block_number> \
SUBGRAPH_NETWORK=horizen-testnet \
npm run prepare:manifest
```

## 验证安装结果

走到这里，可以先做一轮基础检查:

### 1. Service checks

确认下面三件事都成立:

- `curl -sS http://localhost:8080/health` 能返回 `{"ok":true,"service":"tlsn-verifier"}`
- `http://localhost:8090/wise_plugin.tlsn.wasm` 能访问
- `http://localhost:3011/api/circuit-artifact?name=zkp2p_horizen_release` 能返回 JSON

### 2. App checks

打开 `http://localhost:3011`，然后确认:

- 页面能正常加载，没有停在环境变量报错
- 扩展已经出现在浏览器扩展列表里
- 点击启动插件后，页面日志里能看到插件状态开始推进; 如果一开始就提示 `NEXT_PUBLIC_TLSN_WISE_PLUGIN_URL` 缺失，说明 wasm 地址还没配好

如果 Kurier、合约地址和子图都已经接好，继续跑完整流程时，状态通常会按下面这条顺序推进:

```text
wise_opened -> capture_ready -> proving -> proof_ready -> submitted -> verified -> aggregated
```

## 排查顺序

如果流程没有跑通，建议按下面这个顺序排查，不要一开始就盯钱包或者合约:

1. 先看 `NEXT_PUBLIC_TLSN_WISE_PLUGIN_URL` 和 `TLSN_VERIFIER_URL` 有没有写对
2. 再看 `KURIER_API_URL`、`KURIER_API_KEY`、`KURIER_VK_HASH`、`KURIER_AGGREGATION_DOMAIN_ID` 是否匹配同一套 Kurier 配置
3. 再确认 `THEGRAPH_SUBGRAPH_URL` 和 `NEXT_PUBLIC_CONTRACT_ADDRESS` 是否对应同一条链上的同一个部署
4. 如果 proof 已经提交但 aggregation 不出来，再查 statement / tuple / gateway precheck
5. 最后再处理钱包签名、gas、nonce 之类的链上问题
