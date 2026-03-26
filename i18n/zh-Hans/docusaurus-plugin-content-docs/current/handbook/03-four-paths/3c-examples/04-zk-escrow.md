---
title: "zkEscrow"
sidebar_position: 5
---

# Direct Mode Quick Start

这个教程对应的是仓库里的 `direct` 提交流程。
如果你想边看文档边对照代码，直接打开 [JetHalo/zk-Escrow 的 `direct` 分支](https://github.com/JetHalo/zk-Escrow/tree/direct) 会更顺手一些。
如果你想先看实际效果，可以直接打开 [zkEscrow direct 模式演示地址](https://zk-escrow-direct.vercel.app/escrow)。这个地址对应的就是这篇教程讲的 direct 路线。

浏览器本地生成 Groth16 proof，服务端把 `proof`、`publicSignals` 和 `vk` 直接提交给 Kurier。Kurier 状态进入 `finalized` 之后，前端再请求授权签名，最后调用链上 `finalize`。

> 这是一套 **Base Sepolia 测试链** 方案，不是 Base 主网方案。文档里的钱包、RPC、合约地址、测试 ETH 和链上交互，都默认发生在 Base Sepolia。

> 仓库里已经带上了浏览器 proving 需要的 `wasm`、`.zkey` 和 `vkey.json`。如果你的目标只是先把 direct 模式跑通，可以直接使用现成 artifacts。如果你想从电路源码重新生成它们，下面也有完整步骤。

## Prerequisite

开始之前，先准备好下面这些内容：

- Node.js 22.x 或更新版本
- npm
- Foundry
- 一个 Base Sepolia 钱包
- 钱包里的测试 ETH
- 一个可用的 Kurier API Key
- 已部署好的 `ZKEscrowRelease` 合约地址
- 这份合约对应的部署区块
- 和合约 `finalizeAuthority` 一致的私钥

## What you'll learn

完成这篇教程之后，你会得到：

- 一个可以本地启动的 direct 模式环境
- 一份最小可用的 `apps/web/.env.local`
- 一条从 `deposit` 到 `prove` 再到 `finalize` 的完整调试路径
- 一套可选的电路重编译和 The Graph 索引流程

## 1. Understand The Two Modes

先把 `direct` 和 `aggregation` 的差别说清楚。

### Direct mode

`direct` 的重点是“证明直接提交，结果直接消费”。

- 提交 proof 时就把完整 proof、公开输入和 verification key 一起交给 Kurier。
- 前端只轮询 proof 状态。
- 状态到 `finalized` 之后，直接进入授权和链上 `finalize`。
- 当前仓库的主流程就是这条路径，`/api/submit-proof` 固定写的是 `submissionMode: direct`。

### Aggregation mode

`aggregation` 会比 `direct` 多一层聚合批次。

- proof 提交之后，不是立刻按单条结果消费。
- 还要等 proof 被收进 aggregation batch。
- 这时候除了 proof 状态，还要拿 aggregation tuple，例如 `domainId`、`aggregationId`、`leafCount`、`index`、`merklePath`。
- 仓库里保留 `/api/proof-aggregation`，就是为了处理这条路径。

如果你的目标是先把这套流程跑通，先用 `direct`。这个仓库当前默认也是 `direct`。

## 2. Install The Project

### Install the web app dependencies

先安装前端依赖：

```bash
cd apps/web
npm install
```

### Optional: install the subgraph dependencies

如果你准备接 The Graph，再安装 subgraph 依赖：

```bash
cd indexer/subgraph
npm install
```

### Optional: run the contract tests

如果你想先确认合约逻辑是通的，可以执行：

```bash
cd contracts
forge test
```

## 3. Generate The Proving Artifacts

如果你不想直接使用仓库里已经带好的 proving artifacts，而是想从电路源码重新生成 `wasm`、`.zkey` 和 `vkey.json`，走这一步。

这一节是手工流程。当前仓库没有把 circuit build 和 trusted setup 封装成脚本。

### Install the circuit dependencies

`circuits/escrow/circom/escrowRelease.circom` 依赖 `circomlib`，所以先在 `circuits/escrow` 目录补上本地依赖：

```bash
cd circuits/escrow
npm install circomlib snarkjs
```

另外还需要你本机已经装好 `circom` 二进制。

### Compile `escrowRelease.circom`

把电路编译成 `r1cs`、`wasm` 和 `sym`：

```bash
cd circuits/escrow
mkdir -p build
circom circom/escrowRelease.circom --r1cs --wasm --sym -o build
```

执行完之后，关键输出会在这些位置：

- `build/escrowRelease.r1cs`
- `build/escrowRelease.sym`
- `build/escrowRelease_js/escrowRelease.wasm`

### Run the local trusted setup

这个电路走的是 `groth16`。本地开发可以直接做一套本地 ceremony。

> 下面这套流程只适合本地开发和教程复现，不适合拿来当生产 setup。

```bash
cd circuits/escrow

snarkjs powersoftau new bn128 16 build/pot16_0000.ptau
snarkjs powersoftau contribute build/pot16_0000.ptau build/pot16_0001.ptau --name="zkescrow dev ptau" -e="replace-with-random-text"
snarkjs powersoftau prepare phase2 build/pot16_0001.ptau build/pot16_final.ptau

snarkjs groth16 setup build/escrowRelease.r1cs build/pot16_final.ptau build/escrowRelease_0000.zkey
snarkjs zkey contribute build/escrowRelease_0000.zkey build/escrowRelease_final.zkey --name="zkescrow dev zkey" -e="replace-with-random-text"
snarkjs zkey export verificationkey build/escrowRelease_final.zkey build/vkey.json
```

到这里你会得到：

- `build/escrowRelease_final.zkey`
- `build/vkey.json`

### Copy the artifacts into the web app

前端 proving 读取的是 `apps/web/public/zk/escrow` 目录，所以最后还要把新生成的 artifacts 复制过去：

```bash
cp circuits/escrow/build/escrowRelease_js/escrowRelease.wasm apps/web/public/zk/escrow/escrowRelease.wasm
cp circuits/escrow/build/escrowRelease_final.zkey apps/web/public/zk/escrow/escrowRelease_final.zkey
cp circuits/escrow/build/vkey.json apps/web/public/zk/escrow/vkey.json
```

如果你重新生成了 artifacts，建议再重启一次 `apps/web` 的开发服务器，避免继续读到旧缓存。

## 4. Configure The Direct Mode Environment

### Create `apps/web/.env.local`

在 `apps/web` 目录下新建 `.env.local`，填入下面这些值：

```env
NEXT_PUBLIC_ESCROW_ADDRESS=0xYourEscrowAddress
NEXT_PUBLIC_DEPLOY_BLOCK=12345678
NEXT_PUBLIC_DOMAIN=111
NEXT_PUBLIC_APP_ID=222

NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://your-base-sepolia-rpc
INDEXER_RPC_URL=https://your-base-sepolia-rpc
INDEXER_STRATEGY=sqlite

KURIER_API_KEY=your-kurier-api-key
KURIER_API_URL=https://api-testnet.kurier.xyz/api/v1
FINALIZE_AUTH_PRIVATE_KEY=0xyour_finalize_authority_private_key

NEXT_PUBLIC_KURIER_POLL_ATTEMPTS=150
NEXT_PUBLIC_KURIER_POLL_INTERVAL_MS=4000
NEXT_PUBLIC_INDEXER_POLL_INTERVAL_MS=10000
```

### Understand the required values

- `NEXT_PUBLIC_ESCROW_ADDRESS` 是已经部署好的 `ZKEscrowRelease` 合约地址。
- `NEXT_PUBLIC_DEPLOY_BLOCK` 是合约部署区块。索引器会从这个区块开始扫描。
- `NEXT_PUBLIC_DOMAIN` 和 `NEXT_PUBLIC_APP_ID` 必须和合约部署时的配置一致。
- `FINALIZE_AUTH_PRIVATE_KEY` 必须和合约里的 `finalizeAuthority` 对上，否则 `/api/authorize-finalize` 产出的签名不能用。
- 第一次跑教程时，先保留 `INDEXER_STRATEGY=sqlite`。这样前端会直接通过 RPC 扫链，把结果缓存到本地 SQLite，不需要先部署 subgraph。

## 5. Start The Web App

### Run the development server

在 `apps/web` 目录启动开发服务器：

```bash
cd apps/web
npm run dev
```

### Open the escrow page

然后打开：

```text
http://localhost:3000
```

应用会自动跳到 `/escrow`。

如果页面正常加载，你应该能看到：

- `Deposit` / `Withdraw` 两个标签页
- Base Sepolia 网络切换器
- Proof 状态面板

## 6. Run The Direct Flow

### Step 1: create a deposit

1. 连接钱包。
2. 切到 Base Sepolia。
3. 输入存款金额和收款地址。
4. 点击 `Deposit & Lock`。

交易成功后，页面会生成一条 `credential`。这条值后面会直接用来生成 withdrawal proof，先保存好。

### Step 2: generate and submit the proof

1. 把刚才保存的 `credential` 填到 `Withdraw` 页签。
2. 点击 `Unlock`。
3. 浏览器会本地生成 proof。
4. 服务端会把 proof 按 `direct` 模式提交给 Kurier。
5. 前端开始轮询 `/api/proof-status`。
6. 状态进入 `finalized` 之后，服务端通过 `/api/authorize-finalize` 生成授权签名。
7. 钱包发起链上 `finalize` 交易。
8. 收款地址收到资金。

这条路径里不会调用 `/api/proof-aggregation`。如果你看到 aggregation tuple 相关报错，说明当前环境和这篇教程假设的 direct 流程不一致。

## 7. Build And Deploy The Graph Subgraph

如果你不想依赖本地 SQLite 扫链，可以切到 The Graph。

### Install the subgraph dependencies

先进入 `indexer/subgraph`：

```bash
cd indexer/subgraph
npm install
```

### Provide the subgraph inputs

这个 subgraph 会读取 `Deposited` 和 `Finalized` 事件，所以至少要准备好下面这些值：

- `NEXT_PUBLIC_ESCROW_ADDRESS`，或者 `SUBGRAPH_ESCROW_ADDRESS`
- `NEXT_PUBLIC_DEPLOY_BLOCK`，或者 `SUBGRAPH_START_BLOCK`

可选值：

- `SUBGRAPH_NETWORK=base-sepolia`

如果你已经完成了第 4 步，通常不需要重复填写这两个核心值，`npm run render` 会直接读取现有环境变量。

### Generate `subgraph.yaml`

`indexer/subgraph/subgraph.template.yaml` 不是直接部署文件，先渲染成实际的 `subgraph.yaml`：

```bash
cd indexer/subgraph
npm run render
```

### Generate types and build the subgraph

```bash
cd indexer/subgraph
npm run codegen
npm run build
```

跑完之后，就完成了本地 subgraph 生成和构建。

### Deploy to The Graph Studio

先准备 Graph Studio 的部署密钥和 slug：

```bash
export GRAPH_DEPLOY_KEY=<your_studio_deploy_key>
export SUBGRAPH_SLUG=<your_studio_subgraph_slug>
```

然后部署：

```bash
cd indexer/subgraph
npm run auth
npm run deploy
```

如果你不想走 npm script，也可以直接执行：

```bash
graph auth "$GRAPH_DEPLOY_KEY"
graph deploy "$SUBGRAPH_SLUG" subgraph.yaml \
  --node https://api.studio.thegraph.com/deploy/ \
  --deploy-key "$GRAPH_DEPLOY_KEY"
```

### Connect the query URL to the web app

部署成功后，在 Graph Studio 里拿到 query URL，再把它写回 `apps/web/.env.local`：

```env
INDEXER_STRATEGY=thegraph
THEGRAPH_SUBGRAPH_URL=https://your-subgraph-query-url
```

如果你想优先走 The Graph，失败时再回退到本地扫描，也可以这样配：

```env
INDEXER_STRATEGY=hybrid
```

## Troubleshooting

### `Missing NEXT_PUBLIC_ESCROW_ADDRESS`

说明 `apps/web/.env.local` 里还没配好合约地址，或者改完环境变量后没有重启开发服务器。

### `Local scan missing deposits`

通常是 `NEXT_PUBLIC_DEPLOY_BLOCK` 配得太晚，导致本地索引从错误区块开始扫描。把它改成真实部署区块，然后点击页面上的 `Rescan`。

### `Proof not finalized yet`

说明 Kurier 还没有把这条 direct 提交处理到 `finalized`。先检查 `KURIER_API_KEY`、RPC 和 proof 参数，再看 Kurier 返回的原始状态。

### `bad authorization`

先确认 `FINALIZE_AUTH_PRIVATE_KEY` 对应的地址，和合约里配置的 `finalizeAuthority` 是同一个地址。
