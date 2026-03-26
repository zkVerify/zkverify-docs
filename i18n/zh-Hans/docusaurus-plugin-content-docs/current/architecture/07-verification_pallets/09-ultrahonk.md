---
title: Ultrahonk Verifier
---

## [`settlementUltrahonkPallet`](https://github.com/zkVerify/zkVerify/tree/main/verifiers/ultrahonk)

### Statement hash components

- context: `keccak256(b"ultrahonk")`
- vk: `keccak256(vk.encode())`
- pubs: `keccak256(pubs)`

### `Verifier` 实现

该 pallet 验证由 [barretenberg](https://github.com/AztecProtocol/aztec-packages/tree/master/barretenberg) 生成的 UltraHonk 证明（Aztec 工具链）。[Noir](https://noir-lang.org/docs) 编译器以其为后端生成 UltraHonk zk-SNARK，生成证明使用 [nargo](https://noir-lang.org/docs/getting_started/installation/)。当前限制：
1. 仅支持 `bb` 生成的 zk 版证明；
2. 仅支持 Keccak256 作为 transcript 哈希；
3. 不支持递归。

- `verify_proof()` 使用 [ultrahonk_verifier](https://github.com/zkVerify/ultrahonk_verifier/tree/v0.1.0) 验证。
