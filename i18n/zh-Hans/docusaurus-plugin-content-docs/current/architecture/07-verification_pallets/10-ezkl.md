---
title: EZKL Verifier
---

## [`settlementEzklPallet`](https://github.com/zkVerify/zkVerify/tree/main/verifiers/ezkl)

### Statement hash components

- context: `keccak256(b"ezkl")`
- vk: `keccak256(vk.encode())`
- pubs: `keccak256(pubs)`

### `Verifier` 实现

该 pallet 验证使用 [ezkl-verifier](https://github.com/zkonduit/ezkl-verifier/tree/main) 生成的 EZKL（优化 Halo2）证明。该库属于 zkonduit 的 zkML 工具，用于可验证 AI/ML/分析。[EZKL](https://docs.ezkl.xyz/) 接收 ONNX 模型（如神经网络），转换为 ZKP 电路并生成正确执行的证明。当前限制：
1. 仅支持 *reusable* ezkl-verifier 生成的证明；
2. 不支持 accumulators。

- `verify_proof()` 使用 [ezkl_verifier](https://github.com/zkVerify/ezkl_verifier/tree/v0.1.0) 验证。
