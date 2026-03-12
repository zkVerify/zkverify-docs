# ZK Escrow 实战教程：纯操作版

> 目标：按命令一步步把项目从本地跑到 Base Sepolia，完成 `deposit -> prove -> Kurier aggregation -> finalize`。
> 本文只讲操作，不讲源码原理。
> 项目仓库：[JetHalo/zk-Escrow](https://github.com/JetHalo/zk-Escrow)

---

## 0. 先锁定模式

本教程固定使用：

- Submission mode：`aggregation-kurier`
- Verification route：`aggregation-gateway`（合约里调用 `zkVerify.verifyProofAggregation`）
- Indexer strategy：`thegraph`

不要在同一个分支混用 direct/aggregation。

---

## 1. 准备环境

### 1.0 获取项目代码

```bash
git clone https://github.com/JetHalo/zk-Escrow.git
cd zk-Escrow
export REPO_ROOT=$(pwd)
```

### 1.1 必备工具

```bash
# Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup
forge --version
cast --version

# Node + npm
node -v
npm -v

# snarkjs
npm i -g snarkjs
snarkjs --help

# circom
circom --help
```

### 1.2 安装依赖

```bash
cd "$REPO_ROOT/apps/web"
npm install

cd "$REPO_ROOT/contracts"
forge install

cd "$REPO_ROOT/circuits/escrow"
npm install
```

---

## 2. 配置环境变量

### 2.1 `contracts/.env`

```dotenv
PRIVATE_KEY=0x...
RPC_URL=https://base-sepolia.g.alchemy.com/v2/...

# zkVerify Base Sepolia gateway proxy
ZKVERIFY_PROXY=0xEA0A0f1EfB1088F4ff0Def03741Cb2C64F89361E

# vk hash（由 vkey 注册后得到）
VK_HASH=0x...

# 业务域（电路里的 domain）
DOMAIN=1
APP_ID=1
CHAIN_ID=84532

# 稍后部署 hasher 后填入
HASHER_ADDRESS=0x...
```

### 2.2 `apps/web/.env.local`

```dotenv
KURIER_API_URL=https://api-testnet.kurier.xyz/api/v1
KURIER_API_KEY=...
KURIER_VKEY_PATH=public/zk/escrow/vkey.json
KURIER_VK_HASH=0x...

NEXT_PUBLIC_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/...
NEXT_PUBLIC_DOMAIN=1
NEXT_PUBLIC_APP_ID=1
NEXT_PUBLIC_DEPLOY_BLOCK=...

# 聚合域（不是业务 DOMAIN）
KURIER_ZKVERIFY_DOMAIN_ID=2
NEXT_PUBLIC_KURIER_ZKVERIFY_DOMAIN_ID=2

# 推荐：聚合态就允许进入链上预检
NEXT_PUBLIC_KURIER_REQUIRE_FINALIZED=false

# The Graph
INDEXER_STRATEGY=thegraph
THEGRAPH_SUBGRAPH_URL=https://api.studio.thegraph.com/query/.../escrow-base-sepolia-aggregation/v.0.1
NEXT_PUBLIC_THEGRAPH_SUBGRAPH_URL=https://api.studio.thegraph.com/query/.../escrow-base-sepolia-aggregation/v.0.1
```

---

## 3. 构建电路产物（wasm/zkey/vkey）

```bash
cd "$REPO_ROOT/circuits/escrow/circom"
mkdir -p build

# 1) 编译
circom escrowRelease.circom --r1cs --wasm --sym -o build

# 2) ptau（首次）
snarkjs powersoftau new bn128 16 build/pot16_0000.ptau -v
snarkjs powersoftau contribute build/pot16_0000.ptau build/pot16_0001.ptau --name="first" -v -e="random-entropy"
snarkjs powersoftau prepare phase2 build/pot16_0001.ptau build/pot16_final.ptau -v

# 3) zkey
snarkjs groth16 setup build/escrowRelease.r1cs build/pot16_final.ptau build/escrowRelease_0000.zkey
snarkjs zkey contribute build/escrowRelease_0000.zkey build/escrowRelease_final.zkey --name="final" -v -e="random-entropy-2"

# 4) vkey
snarkjs zkey export verificationkey build/escrowRelease_final.zkey build/vkey.json
```

复制到前端静态目录：

```bash
cd "$REPO_ROOT"
mkdir -p apps/web/public/zk/escrow
cp -f circuits/escrow/circom/build/escrowRelease_js/escrowRelease.wasm apps/web/public/zk/escrow/
cp -f circuits/escrow/circom/build/escrowRelease_final.zkey apps/web/public/zk/escrow/
cp -f circuits/escrow/circom/build/vkey.json apps/web/public/zk/escrow/
```

---

## 4. 注册 VK 到 Kurier

```bash
cd "$REPO_ROOT"

node - <<'NODE'
const fs = require('fs');
const vk = JSON.parse(fs.readFileSync('apps/web/public/zk/escrow/vkey.json','utf8'));
const payload = { proofType:'groth16', vk, proofOptions:{ library:'snarkjs', curve:'bn128' } };
fs.writeFileSync('/tmp/kurier-vk.json', JSON.stringify(payload));
console.log('payload saved: /tmp/kurier-vk.json');
NODE

# 确保当前 shell 有 KURIER_API_URL / KURIER_API_KEY
curl -s -X POST "$KURIER_API_URL/register-vk/$KURIER_API_KEY" \
  -H "Content-Type: application/json" \
  --data @/tmp/kurier-vk.json
```

如果返回 `uniq_vk_hash`，表示这个 vk 之前已经注册过，可直接复用。

---

## 5. 部署 Hasher 合约

```bash
cd "$REPO_ROOT"
node scripts/compile-hasher.js

BYTECODE=$(node -p "require('./scripts/hasher.json').bytecode")
cast send --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" --create "$BYTECODE"
```

记录输出里的 `contractAddress`，写回 `contracts/.env` 的 `HASHER_ADDRESS`。

---

## 6. 部署 Escrow 合约

```bash
cd "$REPO_ROOT/contracts"
set -a; source .env; set +a

# 注意：带 --broadcast，且参数顺序保持一致
forge create --broadcast --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" \
  src/ZKEscrowRelease.sol:ZKEscrowRelease \
  --constructor-args "$ZKVERIFY_PROXY" "$VK_HASH" "$DOMAIN" "$APP_ID" "$CHAIN_ID" "$HASHER_ADDRESS"
```

把返回的 `Deployed to` 写到 `apps/web/.env.local` 的 `NEXT_PUBLIC_ESCROW_ADDRESS`。

---

## 7. 启动前端

```bash
cd "$REPO_ROOT/apps/web"
npm run dev
```

访问 `http://localhost:3000/escrow`。

---

## 8. 端到端操作顺序

1. 连接钱包（Base Sepolia）
2. 输入 recipient + amount，执行 `deposit`
3. 复制凭证（credential）
4. 粘贴凭证后点击 unlock
5. 前端会：
   - 本地生成 proof
   - 调 `/api/submit-proof`
   - 轮询 `/api/proof-status`
   - 拉取 `/api/proof-aggregation`
   - 做 `verifyProofAggregation` 预检
   - 满足条件后发 `finalize` 交易（钱包弹窗）

---

## 9. 常用排查命令（按优先顺序）

### 9.1 看 Kurier job 状态

```bash
curl -s "$KURIER_API_URL/job-status/$KURIER_API_KEY/$JOB_ID"
```

### 9.2 看本地 API

```bash
curl -s "http://localhost:3000/api/proof-status?proofId=$JOB_ID"

curl -s -X POST "http://localhost:3000/api/proof-aggregation" \
  -H "Content-Type: application/json" \
  --data "{\"proofId\":\"$JOB_ID\"}"
```

### 9.3 查合约绑定参数

```bash
cast call $ESCROW "vkHash()(bytes32)" --rpc-url "$RPC_URL"
cast call $ESCROW "expectedDomain()(uint256)" --rpc-url "$RPC_URL"
cast call $ESCROW "expectedAppId()(uint256)" --rpc-url "$RPC_URL"
cast call $ESCROW "expectedChainId()(uint256)" --rpc-url "$RPC_URL"
cast call $ESCROW "zkVerify()(address)" --rpc-url "$RPC_URL"
```

### 9.4 查是否有 Finalized 事件

```bash
cast logs --rpc-url "$RPC_URL" \
  --address "$ESCROW" \
  --from-block "$DEPLOY_BLOCK" \
  --to-block latest \
  "Finalized(bytes32,address,uint256)"
```

---

## 10. The Graph 子图部署（可选但推荐）

```bash
cd "$REPO_ROOT/indexer/subgraph"
npm install
npm run render
npm run codegen
npm run build

# token 用 Studio deploy key
export GRAPH_DEPLOY_KEY=...
export SUBGRAPH_SLUG=escrow-base-sepolia-aggregation

npm run auth
npm run deploy
```

部署后把 Query URL 回填到 `THEGRAPH_SUBGRAPH_URL` 与 `NEXT_PUBLIC_THEGRAPH_SUBGRAPH_URL`。


