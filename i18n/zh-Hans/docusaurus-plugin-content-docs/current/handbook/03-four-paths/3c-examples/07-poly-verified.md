---
title: "Poly Verified"
sidebar_position: 8
---

# Poly Verified 安装与本地启动

## 先说这个项目是干什么的

[polyverified](https://github.com/JetHalo/polyverified) 做的是一个给 Polymarket 用的付费信号产品。用户不是进来免费看结论，而是先通过 `x402` 付费，再拿到这一期 market 的方向信号。当前主线是 `BTC / ETH` 的 hourly signal，同时也保留了 `Gold / Silver` 的 daily signal。
如果你想先看实际产品，再回来对照本地安装，可以直接打开 [Poly Verified 演示地址](https://polyverified-production.up.railway.app/)。这个地址就是当前对应的演示入口。

这个产品真正想解决的问题，也不是“怎么把信号卖出去”这么简单。做预测产品最容易被怀疑的一点，是你到底是不是在结果出来之前就发过这条 signal。很多人会看胜率，但大家更在意的是：错的单子有没有删掉，方向有没有改过，时间有没有往前补。

所以这里的做法很直接：

- signal 先发，但先不把完整内容公开，而是先留下 commitment
- 用户通过 `x402` 付费后，才能看到 premium signal
- 这条 commitment 会先 anchor 到链上，留下时间点
- 等 market 结算之后，再 reveal 当时到底发了什么
- reveal 和之前 commitment 能不能对上，再交给 `zkVerify` 去证明

这样一来，用户看到的就不只是一个“我这周胜率多少”的结果页，而是可以回头核对每一条 signal。哪怕那条 signal 最后发错了，也能证明这就是我当时发出去的版本，不是事后篡改出来的。`zkVerify` 在这里的作用，就是把这件事从“我自己这么说”变成“外部也能验”。

## 这个项目大概分成几部分

可以把它先理解成下面五层：

- `Web 应用和 API`
  这一层在 `apps/polymarket-signals`。它负责页面展示、钱包会话、premium unlock、历史记录页面，以及对外和对内的 API。
- `worker 和调度脚本`
  这一层在 `scripts/polymarket-signals`。它按固定节奏触发 `/api/internal/tick`、重试 anchor、推进 signal 生命周期，不把这些后台动作塞进用户请求里。
- `数据库状态层`
  `PostgreSQL` 里存的不只是页面数据，还包括 signals、购买记录、access grants、anchor 状态、proof 状态。它是整套流程的运行账本。
- `证明电路和 proving 工具链`
  `circuits` 目录下的 Noir 电路负责 commitment 和 reveal 的证明逻辑，`nargo` 和 `bb` 负责把这套逻辑真正跑起来，生成可以提交的 proof。
- `链上和外部服务`
  这部分包括 `AnchorRegistry`、支付 token、`Base Sepolia RPC`、`zkVerify`、`Polymarket API`、`Binance API`。前两类提供可验证性，后两类提供市场事实和价格背景。

下面这篇安装说明会按这个结构往下搭，把每一层为什么存在、需要什么配套服务、以及本地怎么接起来一起说清楚。

## 前置条件

开始之前，先准备好下面这些工具和服务：

- `Git`
- `Node.js 22.x`
- `npm 10.x`
- 一个可读写的 `PostgreSQL` 实例
- `forge` 和 `cast`，用于部署与检查链上合约
- `nargo` 与 `bb`，用于本地执行 Noir 电路并生成 `UltraHonk` proof
- 一个 `Base Sepolia RPC` 节点，以及一把有测试币的部署私钥
- 一个可用的 `zkVerify RPC` 端点和对应账户

这些前置条件各自承担的职责很明确：

- `Node.js + npm` 负责运行 `Next.js` Web 服务、worker 脚本和所有仓库脚本。
- `PostgreSQL` 是系统的状态层，信号、commitment、购买记录、access grant、proof 状态都会写在这里。
- `Foundry` 负责链上部分，仓库里的 `anchor` 和 `usdz` 部署脚本都直接调用 `forge` / `cast`。
- `Noir + bb` 负责证明部分。`Noir` 生成 witness，`bb` 再把 witness 和电路编译产物变成 `UltraHonk` proof。
- `Base Sepolia` 这条链承接两件事：一是发 anchor 交易，把 commitment 公开锚定；二是作为 `x402` 的本地支付结算环境。
- `zkVerify` 负责接收 proof 并返回可追踪的 proof reference，这样 reveal 不是只靠数据库自证。

> 如果你当前只是想先把页面和 worker 拉起来，数据库是必须的；`anchor`、`zkVerify` 和 `DeepSeek` 都可以后接。

## 你将完成什么

完成这篇教程后，你会得到一套可本地运行的环境，并且清楚下面这些部件是怎么配合的：

- 克隆仓库并安装 workspace 依赖
- 安装链上与 proving 所需的本地工具链
- 初始化 `PostgreSQL`
- 配置 `apps/polymarket-signals/.env`
- 启动 `web` 服务和 `worker`
- 接入 `x402`、`Base Sepolia anchor` 和 `zkVerify`
- 用仓库自带命令验证主要链路

## 安装项目

### 1. 获取仓库

先把仓库拉到本地：

```bash
git clone https://github.com/JetHalo/polyverified.git
cd polyverified
```

后面的命令都默认在仓库根目录执行。这个仓库用的是 `npm workspaces`，所以从根目录启动最稳妥，`apps`、`contracts`、`circuits` 和 `scripts` 之间的相对路径也都是围绕根目录组织的。

### 2. 安装 JavaScript 依赖

在根目录执行：

```bash
npm install
```

这里不要只在 `apps/polymarket-signals` 里单独安装。仓库把前端、脚本和运行命令统一挂在根目录的 workspace 配置上，从根目录安装可以保证锁文件和依赖解析保持一致。

### 3. 安装 Foundry

仓库里的合约部署与链上检查依赖 `forge` 和 `cast`。如果你还没有装 Foundry，可以先执行：

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
forge --version
cast --version
```

为什么这里必须有 Foundry，而不是只装一个钱包插件就够了？

- `forge` 负责编译和部署 `AnchorRegistry.sol`、`USDZ.sol`
- `cast send` 负责把 commitment anchor 到链上
- `cast receipt` 和 `cast code` 负责确认交易状态和合约地址是否真实可用

也就是说，Foundry 在这个项目里不是“可选开发偏好”，而是链上这条配套服务的命令行入口。

### 4. 安装 Noir 与 Barretenberg

如果你希望本地完整跑通 commitment 和 proof 这条链，需要把仓库里固定的 proving 版本也装好。当前仓库使用的是：

- `Noir / Nargo 1.0.0-beta.6`
- `bb 0.84.0`

先安装 `noirup` 并切到仓库使用的版本：

```bash
curl -fsSL https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
noirup --version 1.0.0-beta.6
nargo --version
```

再安装 `bb`：

```bash
sudo bash scripts/docker/install-bb.sh 0.84.0
bb --version
```

这里沿用的是仓库 `Dockerfile` 里已经验证过的版本组合。这样做的原因很简单：Noir 电路、编译产物和 proving backend 的版本耦合很紧，版本不对时最常见的问题不是“功能少一点”，而是 witness、vk 或 proof 直接不兼容。

它们在项目里的分工也可以这样理解：

- `circuits/polymarket-commitment-hash-noir` 负责把 commitment 输入压成一致的 field 输出
- `circuits/polymarket-commit-reveal-noir` 负责证明 reveal 数据确实对应先前的 commitment
- `nargo execute` 生成 witness
- `bb prove` 和 `bb write_vk` 生成 proof 与验证密钥

### 5. 准备 PostgreSQL

项目启动前，先准备一个可写的数据库。你可以接自己现成的 Postgres，也可以先起一个本地临时实例。比如用 Docker：

```bash
docker run --name polyverified-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=polyverified \
  -p 5432:5432 \
  -d postgres:16
```

这个数据库不是只拿来存页面展示数据。它还承担了几个关键职责：

- 存市场快照和观察数据，方便 worker 做节奏化处理
- 存 `signals`、`signal_commitment_witnesses`、`signal_anchors`、`signal_reveals`
- 存 `purchases` 与 `access_grants`，把支付和内容访问绑定起来
- 存 `zk_proofs`，让 proof 状态和外部 proof reference 可回查

换句话说，它是整个应用的运行账本，而不是可有可无的缓存层。

### 6. 写运行时环境变量

在 `apps/polymarket-signals/.env` 里写入本地开发所需配置：

```dotenv
# Core runtime
APP_BASE_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/polyverified
TREASURY_ADDRESS=0xYourTreasuryAddress

# x402 payment
PAYMENT_NETWORK=base-sepolia
PAYMENT_TOKEN=USDZ
PAYMENT_DISPLAY_AMOUNT=$1.00
PAYMENT_TOKEN_AMOUNT_ATOMIC=1000000
PAYMENT_TOKEN_ADDRESS=0xYourUSDZTokenAddress
PAYMENT_TOKEN_DECIMALS=6
PAYMENT_EIP712_NAME=USDZ
PAYMENT_EIP712_VERSION=1
X402_FACILITATOR_URL=https://facilitator.x402.org

# Worker
TICK_INTERVAL_MS=30000
ENABLE_ANCHOR_WATCH=true

# Anchor service
ANCHOR_ENABLED=false
ANCHOR_NETWORK=base-sepolia
ANCHOR_CHAIN_ID=84532
ANCHOR_RPC_URL=https://base-sepolia.example/rpc
ANCHOR_CONTRACT_ADDRESS=0xYourAnchorRegistryAddress
ANCHOR_SIGNER_PRIVATE_KEY=0xYourSignerPrivateKey
ANCHOR_EXPLORER_BASE_URL=https://sepolia.basescan.org/tx/

# zkVerify
ZKVERIFY_RPC_URL=wss://your-zkverify-endpoint
ZKVERIFY_SEED=your zkverify seed phrase
ZKVERIFY_ACCOUNT_ADDRESS=your zkverify account address
ZKVERIFY_EXPLORER_BASE_URL=https://zkverify-testnet.subscan.io/extrinsic/

# Market data and optional review layer
POLYMARKET_API_BASE_URL=https://gamma-api.polymarket.com
BINANCE_API_BASE_URL=https://api.binance.com
DEEPSEEK_ENABLED=false
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat
```

这组变量背后，对应的是几条不同的配套服务：

- `APP_BASE_URL` 让 worker 知道应该轮询哪个 Web 服务实例。这个项目的 worker 不是直接调用内部函数，而是定时请求 `/api/internal/tick` 和 `/api/internal/retry-anchors`。
- `DATABASE_URL` 和 `TREASURY_ADDRESS` 是运行时硬要求。前者决定状态落在哪里，后者决定 premium unlock 的收款地址是谁。
- `PAYMENT_*` 定义了 `x402` 的收费元数据。原理是服务端先声明价格、资产地址、收款人和网络，客户端支付成功后，服务端再写入购买记录并发放 access grant。
- `ANCHOR_*` 对应链上锚定服务。项目会把 commitment、`signalIdHash` 和预测时间发到 `AnchorRegistry`，这样“我是不是事后改过预测”这个问题就不只靠数据库解释了。
- `ZKVERIFY_*` 对应 proof 提交服务。应用先在本地生成 proof，再把 proof 提交到 `zkVerify`，最后把返回的交易哈希或 statement 写回库里。
- `POLYMARKET_API_BASE_URL` 和 `BINANCE_API_BASE_URL` 分别承担市场事实源和价格背景源。前者告诉系统有哪些市场、何时开盘结算；后者给策略提供更连续的价格序列。
- `DEEPSEEK_*` 是可选审核层。不开也能跑完整个产品；开了以后，它更像是一个额外的策略把关服务，而不是主流程的依赖。

> 当前实现里，只要同时提供 `ANCHOR_RPC_URL` 和 `ANCHOR_SIGNER_PRIVATE_KEY`，`x402` 的 exact payment 结算会优先走本地 facilitator signer，而不是远端 `X402_FACILITATOR_URL`。这样做的好处是本地环境更闭环，但也意味着同一套链上签名配置会同时参与 payment 和 anchor。

### 7. 初始化数据库

环境变量准备好之后，执行：

```bash
npm run db:init
```

这个命令会创建仓库里定义好的表结构。它是幂等的，所以多执行几次也不会把已有表删掉。

这一步背后的原理很简单：应用在启动时并不会自动迁移所有 schema；它依赖显式的初始化脚本把 `signals`、`purchases`、`zk_proofs` 等核心表先准备好。没有这一步，Web 服务虽然能启动，但真正走到读写状态时会很快报错。

### 8. 启动 Web 服务

先把页面和 API 服务跑起来：

```bash
npm run dev
```

启动后，本地开发地址默认是：

```text
http://localhost:3000
```

这层服务承担三件事：

- 渲染前端页面
- 提供公开 API 和内部调度 API
- 提供 `x402` 保护的 premium unlock 路由

从职责上看，它既是用户入口，也是整个项目的应用控制面。所以 worker、手动 `tick`、proof 重试这些动作，最终都是通过它暴露的内部 API 来驱动。

### 9. 启动 Worker

打开第二个终端，在仓库根目录执行：

```bash
npm run tick:watch
```

worker 启动后会按 `TICK_INTERVAL_MS` 周期轮询内部接口：

- `/api/internal/tick`
- `/api/internal/retry-anchors`，前提是 `ENABLE_ANCHOR_WATCH=true`

这个设计不是偶然的。项目把“页面服务”和“节奏化任务”拆开，是为了避免用户请求承担调度职责。换句话说，用户访问页面并不会顺手触发一次 signal 生成；signal 的创建、reveal、anchor retry 都由独立 worker 按节奏推进。

如果你只想手动触发一次生命周期，也可以执行：

```bash
npm run tick
```

### 10. 部署或接入链上配套服务

如果你已经有现成的 `AnchorRegistry` 和支付 token，可以直接把地址填回 `.env`，然后跳到下一节。否则，可以用仓库自带脚本先把测试环境需要的两个合约部署起来。

先部署 `AnchorRegistry`：

```bash
npm run anchor:deploy
```

这个合约本身非常克制，只做一件事：发出 `CommitmentAnchored` 事件。它不在链上维护复杂业务状态，只把 commitment、`signalIdHash` 和时间点公开写出去。这样做的好处是 gas 开销低，也更符合这个项目对“外部可审计锚点”的需求。

再部署 `USDZ`：

```bash
npm run usdz:deploy
```

这个 token 的存在是为了让本地和测试网的 `x402` 解锁流程有一条明确的支付轨道。它支持 `transferWithAuthorization`，也就是基于 `EIP-712` 的签名转账授权。这样前端解锁 premium signal 时，不需要先走一遍传统的 `approve -> transferFrom` 两步流程，支付和授权可以更直接地绑定起来。

部署成功后，把返回的地址写回 `apps/polymarket-signals/.env`：

- 把 `AnchorRegistry` 地址写入 `ANCHOR_CONTRACT_ADDRESS`
- 把 `USDZ` 地址写入 `PAYMENT_TOKEN_ADDRESS`
- 确认 `PAYMENT_TOKEN_AMOUNT_ATOMIC=1000000` 与 `PAYMENT_TOKEN_DECIMALS=6`
- 把 `ANCHOR_ENABLED` 从 `false` 改成 `true`

改完环境变量后，重启 `web` 和 `worker`，让运行时配置重新生效。

### 11. 验证 Anchor 链路

确认链上合约已经部署好之后，先检查地址上是否真有代码：

```bash
npm run anchor:check
```

再发一笔测试 anchor：

```bash
npm run anchor:test
```

这两步分别验证两件不同的事情：

- `anchor:check` 验证你填的不是一个空地址
- `anchor:test` 验证 signer、RPC、合约 ABI 和交易广播都能真正打通

如果这一步失败，后面 worker 即使能生成 signal，也只会把 anchor 状态留在 `pending` 或 `failed`。

### 12. 验证 proof 提交链路

当数据库里已经有一条可 prove 的 signal 后，可以手动触发一次 proof 提交：

```bash
npm run zk:prove-signal -- <signal-id>
```

这条命令会请求：

```text
/api/internal/prove-signal/<signal-id>
```

完整过程是：

- 先从数据库取出 signal 和 witness
- 用 `Noir` 电路生成 witness
- 用 `bb` 产出 `UltraHonk` proof
- 把 proof 提交给 `zkVerify`
- 把返回的 `tx hash` 或 `statement` 写回本地数据库

proof 这一步最重要的意义，不是“再做一遍 reveal”，而是把 reveal 和之前 commitment 之间的一致性，交给独立验证网络来背书。

## 验证安装结果

至少跑完下面这些命令，再认为本地环境已经基本可用：

```bash
npm test
npm run build
npm run contracts:test
npm run tick
```

它们分别覆盖：

- `npm test`：前端和服务端单元测试
- `npm run build`：Next.js 生产构建是否通过
- `npm run contracts:test`：Foundry 合约测试是否通过
- `npm run tick`：worker 生命周期主入口至少能手动跑一次

如果你的链上配置也已经接好，再追加验证：

```bash
npm run anchor:check
npm run anchor:test
```

如果 `zkVerify` 也准备好了，再用一条已生成的 `signal-id` 触发：

```bash
npm run zk:prove-signal -- <signal-id>
```

## 常见卡点

### `DATABASE_URL is required`

说明 `apps/polymarket-signals/.env` 没有被正确加载，或者数据库变量没写进去。先确认 `DATABASE_URL` 是否存在，再确认命令是不是在仓库根目录执行。

### `PAYMENT_TOKEN_AMOUNT_ATOMIC and PAYMENT_TOKEN_ADDRESS are required for x402`

说明你已经触发了 premium unlock 路由，但 `x402` 的支付资产还没配完整。至少把 `PAYMENT_TOKEN_AMOUNT_ATOMIC`、`PAYMENT_TOKEN_ADDRESS`、`TREASURY_ADDRESS` 这三项补齐。

### `ANCHOR_* is required when anchoring is enabled`

说明你把 `ANCHOR_ENABLED=true` 打开了，但链上 RPC、合约地址或 signer 还没有配齐。`anchor` 这一层一旦启用，就不会再退回“只写数据库”的模式。

### `ZKVERIFY_RPC_URL is required` 或 `ZKVERIFY_SEED is required`

说明你已经进入 proof 提交流程，但 `zkVerify` 账户还没有配置完整。proof 在本地生成成功，不代表已经提交到外部验证网络；少了这两个配置，流程会停在提交前。
