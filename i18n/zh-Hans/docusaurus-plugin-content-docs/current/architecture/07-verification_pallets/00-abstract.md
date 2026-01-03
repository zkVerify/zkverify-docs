---
title: 抽象 Verifier
---

## [`Abstract Verifier`](https://github.com/zkVerify/zkVerify/tree/main/pallets/verifiers)

通用 verifier 抽象，定义所有 verifier 的 extrinsic、事件、错误，并实现 statement hash 生成逻辑。每个 verifier 需实现 `hp_verifiers::Verifier` trait：

- `Proof`: 证明数据
- `Vk`: 验证 key 数据
- `Pubs`: 公共输入数据
- `fn verify_proof()`：主验证逻辑
- `fn hash_context_data()`：标识 verifier 的唯一上下文（例如 `b"ultraplonk"`、`b"risc0"`）
- `fn pubs_bytes()`：将公共输入转为字节，供最终 statement 中的 `keccak256` 使用
- `fn validate_vk()`：定义如何校验 vkey 合法性（默认全部接受）
- `fn vk_bytes()`：获取 vkey 字节，供 `Self::vk_hash()` 使用（默认 scale 编码）
- `fn vk_hash()`：vkey 的哈希方式；若 vkey 已是哈希，可直接返回（默认对 `Self::vk_bytes()` 做 `keccak256`）
- `fn verifier_version_hash()`：区分 verifier 版本的唯一指纹；无版本则默认固定摘要

除验证逻辑与序列化外，开发者需关注 statement 摘要的计算。[提交流程](../03-proof-submission-interface.md)中，zkVerify 会为每个证明生成唯一摘要，链上合约也可能需计算该摘要。因此 trait 允许通过 `pubs_bytes()` 定义公有输入编码，简化链上处理；`vk_bytes()` 定义 vkey 编码（常由 ZkRollup/ZkApp 部署时给定）。若 vkey 已是哈希（如 Risc0），可通过 `vk_hash()` 跳过再次哈希。

### Statement 摘要如何计算

给定 verifier 实现 `V`，其中 `pubs` 为公共输入，`vk` 为验证 key，摘要计算如下：

```rust
let ctx = V::hash_context_data();
let vk_hash = V::vk_hash(&vk);
let pubs_bytes = V::pubs_bytes(&pubs);
let version_hash = V::verifier_version_hash(proof);

let mut data_to_hash = keccak_256(ctx).to_vec();
data_to_hash.extend_from_slice(vk_hash.as_bytes());
data_to_hash.extend_from_slice(version_hash.as_bytes());
data_to_hash.extend_from_slice(keccak_256(pubs_bytes).as_bytes_ref());
H256(keccak_256(data_to_hash.as_slice()))
```

### Submit Proof

[`submitProof`](https://github.com/zkVerify/zkVerify/tree/main/pallets/verifiers/src/lib.rs#L213) extrinsic 会（如需）从存储读取 vkey，并调用 `verify_proof()` 校验证明。

### Register Verification Key

如需在提交时使用 vkey 哈希而非 vkey 本身，请先通过 [`registerVk`](https://github.com/zkVerify/zkVerify/tree/main/pallets/verifiers/src/lib.rs#L241) 注册。该 extrinsic 会把 vkey 存入存储，并触发 `VkRegistered(hash)` 事件，后续可在 `submitProof` 调用中使用该哈希。
