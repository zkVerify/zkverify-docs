---
title: 构建 Verification Pallet
---

### Overview
在前期反响后，多款 verifier 已在开发！仍有大量空缺，最新需求列表见下方。

先阅读 “[新增 Verifier 教程](https://docs.zkverify.io/tutorials/add-new-verifier/introduction)”，了解如何在链上添加 verifier。

建议参考现有 [verifier 实现](https://github.com/zkVerify/zkVerify/tree/main/verifiers)，尤其需要跨椭圆曲线验证或不同输入规模基准时。

如需指导，可在 [Discord](https://discord.com/invite/zkverify) 联系团队。

### Scope
From higher to lower priority:

* Stwo (Starkware, Cairo)
    * Objective: Support verification of Starkware zkRollup’s proofs as well as generic proofs generated via Cairo programs
* Stone
    * Objective: Support verification of Starkware zkRollup’s proofs as well as generic proofs generated via Cairo programs
* Jolt
* Kimchi + Pickle
    * Objective: Support verification of Mina’s succinct state proofs as well as proofs generated via O1-JS
* Supernova 
    * Over “pasta” cycle of elliptic curves
* Starky

### 要求与最佳实践

* 使用 Rust，工具链需最新稳定版（便于 WASM 编译直接接入 runtime）。

* 尽量复用已有且审计/成熟的方案；如用第三方库，确保其开源许可。

* 必须支持 “no-std”（WASM 可编译，直接进 runtime）。
    * 为便于无分叉升级 verifier。如无法全 no-std，可将底层库放 node（Rust），业务逻辑在 runtime（WASM, no-std）。我们的 [Risc0](https://github.com/zkVerify/zkVerify/blob/main/native/src/risc0.rs) 与 [Ultraplonk-Noir](https://github.com/zkVerify/zkVerify/blob/main/native/src/ultraplonk.rs) 亦采用此方式。
    * 若仍不行，可重写 verifier 确保 no-std。

* 需提供基准测试。若执行时间取决于电路规模/配置等，务必在基准中体现。可参考 [Risc0](https://github.com/zkVerify/zkVerify/blob/main/verifiers/risc0/src/benchmarking.rs) 与 [Ultraplonk-Noir](https://github.com/zkVerify/zkVerify/blob/main/verifiers/ultraplonk/src/benchmarking.rs)。

* 避免依赖外部仓库的 fork。如因 no_std 等必须 fork，需能向上游提交 PR 合并改动。

* 区块上限 5MB，单块执行上限 1.5s。如产物或验证超限，请立即与我们沟通。

* Verification Library 测试：
    * 覆盖验证成功/失败路径、vk/proof/public inputs 的序列化/反序列化。
    * 包含部分硬编码数据，最好取自第三方链上/官方来源，视集成场景而定。


* Verification Pallet 测试应包括：
    * Pallet 正确接入 runtime
    * mock runtime 的单元测试
    * 权重测试
    * 更新 e2e 测试覆盖新 verifier


* 新增 pallet 的文档需提交至 zkverify-docs [仓库](https://github.com/zkVerify/zkVerify-docs)，格式参考现有 [文档](https://docs.zkverify.io/overview/verification_pallets/abstract/)。


* 提供端到端教程，说明如何为新 verifier 提交证明。如集成 gnark，需记录/引用 gnark 生成 proof 的流程。


* 提供必要工具，将选定来源（如 Gnark）的 proof/vk/public inputs 转换为链上可用格式。


* 提交链上可用 Polkadot JS 前端（复制粘贴）或使用 JS/Rust 代码。


* 可参考已有 [教程](https://docs.zkverify.io/tutorials/submit-proofs/typescript-example)。

### 验收与提交流程

* 代码需可编译且 CI 通过。本地跑 CI 见[说明](https://github.com/zkVerify/zkVerify?tab=readme-ov-file#running-github-workflows-on-local-environment)。若需额外依赖可修改 CI，或联系团队。

* 避免编译时间大幅增加（如依赖过重），否则可能被拒。请锁定依赖版本避免意外更新。

* 从 “main” 分支创建分支，命名建议为 “\<verifier_name>-verifier”。

* 向 [zkVerify 仓库](https://github.com/zkVerify/zkVerify) 提 PR 至 “main”，评审期间保持与 main 同步，需更新请使用 rebase。

* 提交需签名。

* 确保 CI 通过，如失败请修复并联系团队重跑。

* [文档与教程] 向 zkVerify [文档仓库](https://github.com/zkVerify/zkVerify-docs) 提 PR 至 main。

* 至少 2 位团队成员评审，请保持响应。


### 申请流程
请填写 [申请表](https://forms.gle/idYKZ8n7T21embgLA)。我们寻找具备密码学、区块链背景且最好有零知识经验的开发者。请详细说明过往项目与感兴趣/擅长的 verifier 实现。

团队会审核申请，公平分配任务，避免多人重复同一 verifier（每种类型仅奖励一个实现）。

