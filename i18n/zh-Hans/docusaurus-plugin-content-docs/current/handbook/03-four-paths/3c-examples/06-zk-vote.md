---
title: "zkVote"
sidebar_position: 7
---
# 安装 zkVote 开发环境

如果你想一边安装一边对照源码，仓库入口就在 [zkvote](https://github.com/JetHalo/zkvote)。
如果你想先看实际应用，再回来对照安装步骤，可以直接打开 [zkVote 演示地址](https://zkvote-production.up.railway.app/)。这个地址就是对应的 demo 入口。

## 先认识一下 zkVote

zkVote 可以理解成一个“匿名投票系统”的完整样板。项目方可以发起提案，用户先拿到投票资格，再用匿名方式参与投票。系统会检查你有没有资格投，也会记录这次投票有没有成功走完整条验证流程，但不会把钱包地址和投票选项直接绑在一起。

整个项目大致分成四部分。`zkvote-console` 是你实际打开和操作的应用；`VotingPass` 和 `ProposalRegistry` 是链上部分，一个管投票资格，一个管提案；`PostgreSQL` 负责保存应用里的记录；`Goldsky`、`IPFS` 和 `zkVerify` 是配套服务，分别用来恢复链上事件、保存提案正文和跟踪证明状态。

## Prerequisite

- Node.js 20+
- npm 10+
- PostgreSQL 14+，用于保存成员关系、证明记录、投票记录和提案元数据 URI
- MetaMask 或其他兼容 EVM 的钱包，用于真实的 mint 和提案创建
- Foundry，只在你准备自己部署合约时需要
- Goldsky 账号和 CLI，只在你准备接入链上索引时需要
- zkVerify 的 RPC、WebSocket 和签名账户，只在你准备接入真实证明提交流程时需要

## What you'll learn

完成这篇教程后，你会得到一套可以直接继续开发的环境，并且会知道：

- 怎样安装整个仓库的依赖并启动 `zkvote-console`
- 为什么数据库要先接上，以及这个项目在没有数据库时会退回到什么模式
- `VotingPass`、`ProposalRegistry`、Goldsky、IPFS、zkVerify 在整条链路里分别负责什么
- 哪些服务是“先跑起来再说”的可选项，哪些服务一旦进入真实联调就不能再省

## 配套服务一览

| 组件 | 是否建议一开始就接入 | 负责什么 | 为什么这样设计 |
| --- | --- | --- | --- |
| PostgreSQL | 是 | 保存 memberships、proofs、votes、proposal metadata URI | 这些都是应用态数据，不适合放链上；如果不接数据库，服务会退回内存仓库，重启后状态会丢失 |
| `VotingPass` 合约 | 做真实 mint 时必须 | 铸造投票资格 NFT | 资格凭证单独成约，比把资格直接写在提案合约里更清晰，也方便前端判断用户是否有票 |
| `ProposalRegistry` 合约 | 做真实提案创建时必须 | 记录提案骨架、时间窗、快照块高、`metadataUri` | 合约只保留投票所需的最小链上事实，正文放到链下，控制 gas 和存储成本 |
| Goldsky Subgraph | 本地演示可选，联调和重启恢复时强烈建议 | 索引 `VotingPass.Transfer`、`ProposalCreated`、`GroupRootSet` 等事件 | 应用重启后，需要有一个读模型把链上事实重新拉回来，否则只能看到本地数据库里那一层 |
| IPFS Pinning + Gateway | 需要创建可恢复提案时建议接入 | 保存提案正文，返回 `ipfs://...` | 提案标题、描述、选项不适合全部写进合约，链上只保留 `metadataUri` 和哈希更稳妥 |
| zkVerify | 本地 UI 联调可选，真实证明提交流程必须 | 接收 Groth16 证明验证任务并返回状态 | 项目允许先用本地 fallback 走通页面和状态流转，等链路稳定后再切真实验证网络 |

## 安装项目

1. ### 获取代码并安装 workspace 依赖

   在一个空目录里执行：

   ```bash
   git clone https://github.com/JetHalo/zkvote.git
   cd zkvote
   npm install
   ```

   这一步要在仓库根目录完成，因为项目用了 npm workspaces。根目录的 `npm install` 会把 `apps/web` 和 `apps/zkvotefront/zkvote-console` 的依赖一起解析好，后面无论你跑前端、数据库脚本，还是子图构建，都基于这套工作区依赖。

2. ### 复制环境变量模板

   先把两个模板文件复制出来：

   ```bash
   cp apps/zkvotefront/zkvote-console/.env.local.example apps/zkvotefront/zkvote-console/.env.local
   cp contracts/.env.example contracts/.env
   ```

   `apps/zkvotefront/zkvote-console/.env.local` 负责应用运行时配置，`contracts/.env` 负责部署合约时的链和账户配置。它们分开是有意义的：前者要给 Next.js 和服务端 API 读取，后者只服务于合约部署，不应该把私钥混进前端运行环境。

   如果你先以当前主应用的默认链路启动环境，建议把这几项先填好：

   ```bash
   # apps/zkvotefront/zkvote-console/.env.local
   NEXT_PUBLIC_CHAIN_NAME=Horizen Testnet
   NEXT_PUBLIC_CHAIN_ID=2651420
   NEXT_PUBLIC_RPC_URL=https://horizen-testnet.rpc.caldera.xyz/http
   DATABASE_URL=postgresql://YOUR_DB_USER@localhost:5432/zkvote
   NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=
   NEXT_PUBLIC_PROPOSAL_REGISTRY_ADDRESS=
   ```

   如果你后面准备自己部署合约，建议同时把 `contracts/.env` 也对齐到同一条链，避免前端和合约脚本指向不同网络：

   ```bash
   # contracts/.env
   PRIVATE_KEY=
   RPC_URL=https://horizen-testnet.rpc.caldera.xyz/http
   CHAIN_ID=2651420
   NFT_PASS_ADDRESS=
   PROPOSAL_REGISTRY_ADDRESS=
   ```

3. ### 安装并配置钱包插件

   配套服务：浏览器扩展钱包

   准备一个兼容 EVM 的浏览器钱包即可，MetaMask 最常见。这个项目的前端通过浏览器注入的 `window.ethereum` 发起连接、切链、`mint` 和 `createProposal`，所以只配命令行私钥不够。

   钱包装好后，创建或导入账户，并确认已经切到 `Horizen Testnet`。如果钱包里还没有这条链，可以手动添加：

   ```text
   Network Name: Horizen Testnet
   RPC URL: https://horizen-testnet.rpc.caldera.xyz/http
   Chain ID: 2651420
   Currency Symbol: ETH
   Block Explorer URL: https://horizen-testnet.explorer.caldera.xyz
   ```

   也可以直接打开应用再连接钱包，前端会按 `.env.local` 里的 `NEXT_PUBLIC_CHAIN_*` 尝试自动补上链配置。

4. ### 准备 PostgreSQL，并初始化数据库结构

   配套服务：PostgreSQL

   先创建数据库：

   ```bash
   createdb zkvote
   ```

   然后在仓库根目录执行初始化脚本：

   ```bash
   DATABASE_URL=postgresql://YOUR_DB_USER@localhost:5432/zkvote npm run db:init --workspace zkvote-console
   ```

   预期输出：

   ```text
   Database schema applied.
   ```

   这里特意把 `DATABASE_URL` 写在命令前面，是因为 `db:init` 是一个纯 Node 脚本，不会像 `next dev` 那样自动读取 `.env.local`。它的职责只是把 `apps/zkvotefront/zkvote-console/db/schema.sql` 里的表结构应用到数据库里，让投票相关的应用态数据有地方落地。

   如果你跳过这一步，应用仍然能启动，但会退回内存仓库模式。这样做适合快速看 UI，不适合持续开发，因为服务一重启，membership、proof、vote 和提案元数据记录都会丢失。

5. ### 启动本地应用

   在仓库根目录运行：

   ```bash
   npm run dev --workspace zkvote-console -- --hostname 0.0.0.0 --port 3101
   ```

   打开 [http://localhost:3101](http://localhost:3101)。

   你也可以顺手检查一次运行时配置：

   ```bash
   curl http://localhost:3101/api/config
   ```

   如果 PostgreSQL 已经接好，返回的 `config` 里应该至少能看到：

   ```json
   {
     "serviceMode": "postgresql",
     "goldskyConfigured": false,
     "zkVerifyConfigured": false
   }
   ```

   这一层只负责把应用跑起来。此时就算你还没有部署合约、没有接 Goldsky，也能先确认页面、API 和本地状态管理是否正常。把最小系统先跑通，再去接链和外部服务，定位问题会容易得多。

6. ### 需要本地测试提案元数据时，启动一个 IPFS mock

   配套服务：IPFS Pinning API + Gateway

   在另一个终端里运行：

   ```bash
   npm run ipfs:mock --workspace zkvote-console
   ```

   预期输出会包含：

   ```text
   mock-ipfs listening on http://127.0.0.1:8787
   pin endpoint: http://127.0.0.1:8787/pin
   gateway base: http://127.0.0.1:8787/ipfs
   ```

   然后把这两项写进 `apps/zkvotefront/zkvote-console/.env.local`：

   ```bash
   NEXT_PUBLIC_IPFS_GATEWAY_URL=http://127.0.0.1:8787/ipfs
   IPFS_API_URL=http://127.0.0.1:8787/pin
   ```

   这个项目的提案正文不会整段塞进链上。链上保留的是 `metadataUri` 和相关哈希，正文本身放在 IPFS 这类内容寻址存储里。这样一来，`ProposalRegistry` 只保存投票必须知道的结构化事实，提案的可读内容则交给链下存储，既省 gas，也方便恢复。

   在开发阶段，本地 mock 的意义是先把“上传提案元数据 -> 拿到 `ipfs://...` -> 页面再用 gateway 读回来”这条路径跑通，不必一上来就依赖外部 pinning 服务。

7. ### 需要真实链上交互时，部署 `VotingPass` 和 `ProposalRegistry`

   配套服务：Foundry + Horizen Testnet RPC + 部署钱包

   这一步建议不要跳着做。先检查工具、再检查钱包、再编译、再部署、最后把地址回填到前端。这样哪一步出错，一眼就能看出来。

   如果本机还没有 Foundry，可以先按官方安装方式装好：

   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   forge --version
   cast --version
   ```

   Foundry 里最常用的两个命令就是 `forge` 和 `cast`。前者负责编译和部署，后者负责读余额、查地址、调合约。把这两者都装好，后面的部署和自检才顺。

   接着准备 `contracts/.env`。这里的 `PRIVATE_KEY` 建议填不带 `0x` 的十六进制私钥，和仓库现有模板保持一致：

   ```bash
   PRIVATE_KEY=YOUR_PRIVATE_KEY_WITHOUT_0X
   RPC_URL=https://horizen-testnet.rpc.caldera.xyz/http
   CHAIN_ID=2651420
   NFT_PASS_ADDRESS=
   PROPOSAL_REGISTRY_ADDRESS=
   ```

   然后进入合约目录，加载环境变量并检查部署账户：

   ```bash
   cd contracts
   set -a
   source .env
   set +a

   cast wallet address --private-key "$PRIVATE_KEY"
   cast balance "$(cast wallet address --private-key "$PRIVATE_KEY")" --rpc-url "$RPC_URL"
   ```

   先看地址和余额，是为了避免最常见的两类问题：私钥填错，或者账户根本没有测试网 gas。只有确认部署账户可用，后面的部署结果才有意义。

   现在先编译一遍：

   ```bash
   forge build
   ```

   `VotingPass` 有三个构造参数：`name`、`symbol` 和 `baseTokenURI`。`ProposalRegistry` 没有构造参数。理解这一点很重要，因为子图和前端后面都要消费这两个合约，但它们负责的链上职责并不一样：

   - `VotingPass` 负责发放投票资格 NFT，前端会直接调用它的 `mint()`
   - `ProposalRegistry` 负责登记提案骨架，前端会直接调用它的 `createProposal(...)`

   先部署 `VotingPass`：

   ```bash
   forge create src/VotingPass.sol:VotingPass \
     --rpc-url "$RPC_URL" \
     --private-key "$PRIVATE_KEY" \
     --broadcast \
     --constructor-args "zkVote Pass" "ZKPASS" "ipfs://zkvote-pass/"
   ```

   这条命令执行成功后，会输出合约地址和交易哈希。把两者先记下来，尤其是交易哈希，后面配置 Goldsky `startBlock` 时会用到。

   继续部署 `ProposalRegistry`：

   ```bash
   forge create src/ProposalRegistry.sol:ProposalRegistry \
     --rpc-url "$RPC_URL" \
     --private-key "$PRIVATE_KEY" \
     --broadcast
   ```

   两个合约都部署完后，先做一次链上读验证。不要急着把地址塞进前端，先确认链上读取得到的确实是你刚发出去的合约：

   ```bash
   cast call "$NFT_PASS_ADDRESS" "name()(string)" --rpc-url "$RPC_URL"
   cast call "$NFT_PASS_ADDRESS" "symbol()(string)" --rpc-url "$RPC_URL"
   cast call "$PROPOSAL_REGISTRY_ADDRESS" "nextProposalId()(uint256)" --rpc-url "$RPC_URL"
   ```

   如果你想再往前走一步，也可以直接用 CLI 试铸造一枚：

   ```bash
   cast send "$NFT_PASS_ADDRESS" "mint()" \
     --rpc-url "$RPC_URL" \
     --private-key "$PRIVATE_KEY"
   ```

   然后确认余额和持有人：

   ```bash
   DEPLOYER=$(cast wallet address --private-key "$PRIVATE_KEY")
   cast call "$NFT_PASS_ADDRESS" "balanceOf(address)(uint256)" "$DEPLOYER" --rpc-url "$RPC_URL"
   cast call "$NFT_PASS_ADDRESS" "ownerOf(uint256)(address)" 1 --rpc-url "$RPC_URL"
   ```

   最后，把地址回填到两个配置文件里：

   ```bash
   # contracts/.env
   NFT_PASS_ADDRESS=0x...
   PROPOSAL_REGISTRY_ADDRESS=0x...

   # apps/zkvotefront/zkvote-console/.env.local
   NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
   NEXT_PUBLIC_PROPOSAL_REGISTRY_ADDRESS=0x...
   ```

   这一回填动作很关键。因为前端的真实 mint 和提案创建不会读 `contracts/.env`，它只认 `apps/zkvotefront/zkvote-console/.env.local` 里的 `NEXT_PUBLIC_*` 地址。如果你只更新了合约目录，页面还是会连到旧地址或空地址。

8. ### 需要在重启后恢复链上事实时，部署 Goldsky Subgraph

   配套服务：Goldsky CLI + Graph CLI

   这一步建议拆成“安装 CLI”“准备 manifest”“本地 codegen/build”“远端 deploy”四段。Goldsky 部署失败时，问题通常就出在这四段中的某一段。

   如果本机还没有 Goldsky CLI，可以先按官方安装方式处理：

   ```bash
   curl https://goldsky.com | sh
   goldsky --version
   goldsky login
   ```

   子图本地构建需要 `@graphprotocol/graph-cli`，不过这个仓库已经把它写在 `subgraphs/zkvote/package.json` 里了，所以不需要全局安装，进入子图目录单独装依赖就够了：

   ```bash
   cd subgraphs/zkvote
   npm install
   ```

   接下来先更新 `subgraph.yaml`。当前仓库已经带了一份可运行的 scaffold，但你每次重新部署合约后，都应该同步修改这四个值：

   - `VotingPass.source.address`
   - `VotingPass.source.startBlock`
   - `ProposalRegistry.source.address`
   - `ProposalRegistry.source.startBlock`

   `address` 很直接，就是你刚部署出来的两个地址。`startBlock` 则建议填对应合约的部署区块，而不是随便写当前高度。这样做的原因是子图会从 `startBlock` 开始回放事件；写得太早会多扫很多无效区块，写得太晚则会漏掉部署初期的事件。

   如果你刚才记下了部署交易哈希，可以用 `cast receipt` 查区块号：

   ```bash
   cast receipt <VOTING_PASS_DEPLOY_TX_HASH> --rpc-url https://horizen-testnet.rpc.caldera.xyz/http
   cast receipt <PROPOSAL_REGISTRY_DEPLOY_TX_HASH> --rpc-url https://horizen-testnet.rpc.caldera.xyz/http
   ```

   把返回里的 `blockNumber` 分别填进 `startBlock`。一个可读的例子像这样：

   ```yaml
   dataSources:
     - kind: ethereum
       name: VotingPass
       network: horizen-testnet
       source:
         address: "0xYourVotingPassAddress"
         abi: VotingPass
         startBlock: 12345678
   ```

   manifest 改好以后，先本地生成类型，再本地构建：

   ```bash
   npm run codegen
   npm run build
   ```

   之所以先做这两步，是因为绝大多数子图错误其实和 Goldsky 本身无关，而是 ABI、schema、mapping 或 `subgraph.yaml` 写错了。先在本地把 `codegen` 和 `build` 跑通，远端部署阶段就只剩认证和上传这两个变量。

   本地构建通过后，再执行远端部署：

   ```bash
   goldsky subgraph deploy zkvote-horizen-testnet/1.0.0 --path .
   ```

   这条命令会把当前目录下的子图源码上传到 Goldsky，并返回一个查询端点。把它回填到应用配置里：

   ```bash
   # apps/zkvotefront/zkvote-console/.env.local
   GOLDSKY_SUBGRAPH_URL=https://api.goldsky.com/api/public/<project>/subgraphs/zkvote-horizen-testnet/1.0.0/gn
   ```

   回填后重启开发服务，再访问：

   ```bash
   curl http://localhost:3101/api/config
   ```

   如果 `goldskyConfigured` 变成 `true`，说明应用已经开始把 Goldsky 当作链上读模型来使用。它的职责不是替代 PostgreSQL，而是补上“链上发生过什么”这一层事实。数据库保存的是 memberships、proofs、votes 这些应用态；Goldsky 保存的是 `Transfer`、`ProposalCreated`、`GroupRootSet` 这种事件索引。两层都在，系统重启后才能恢复得完整。

9. ### 需要真实证明提交流程时，接入 zkVerify

   配套服务：zkVerify

   把 zkVerify 相关变量写进 `apps/zkvotefront/zkvote-console/.env.local`：

   ```bash
   ZKVERIFY_RPC_URL=...
   ZKVERIFY_WS_URL=...
   ZKVERIFY_NETWORK=Volta
   ZKVERIFY_MNEMONIC=...
   ```

   这几个值分别对应 zkVerify 的 RPC 入口、事件订阅入口、目标网络和用于提交验证交易的账户。项目里已经把 `zkverifyjs` 接进服务端适配层了，所以这里只需要把连接信息补齐，不需要再额外改代码。

   这里的原理也值得说明一下。浏览器端用 Semaphore 生成的是 Groth16 证明，服务端收到证明后，会把它交给 zkVerify，并持续跟踪 `pending -> includedInBlock -> finalized` 这条状态链。只要这三项环境变量不完整，项目就会自动退回本地 fallback 适配器，用确定性的时间推进来模拟状态变化，方便你先把 UI、API 和状态流转走通。

10. ### 做一次完整检查

   重新启动开发服务后，再检查一次配置：

   ```bash
   curl http://localhost:3101/api/config
   ```

   你可以用下面这组信号判断当前环境处在哪个阶段：

   - `serviceMode` 为 `postgresql`：数据库已经接好
   - `goldskyConfigured` 为 `true`：链上读模型已经接好
   - `zkVerifyConfigured` 为 `true`：真实证明提交流程已经接好
   - `ipfsConfigured` 为 `true`：提案元数据上传已经接好

   最后补一轮基础检查：

   ```bash
   npm run test --workspace zkvote-console
   npm run typecheck --workspace zkvote-console
   ```

