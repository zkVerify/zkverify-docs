---
title: Ultraplonk Verifier
---

## [`settlementUltraplonkPallet`](https://github.com/zkVerify/zkVerify/tree/main/verifiers/ultraplonk)

### Statement hash components

- context: `keccak256(b"ultraplonk")`
- vk: `keccak256(vk.encode())`
- pubs: `keccak256(pubs)`

### `Verifier` 实现

该 pallet 验证由 [barretenberg](https://github.com/AztecProtocol/aztec-packages/tree/master/barretenberg) 生成的 UltraPlonk 证明。barretenberg 属于 Aztec 的密码工具套件。[Noir](https://noir-lang.org/docs) 编译器以其为后端生成 UltraPlonk zk-SNARK 证明，生成证明可使用 [nargo](https://noir-lang.org/docs/getting_started/installation/)。

:::warning
从 [bbup v.0.87.0](https://github.com/AztecProtocol/aztec-packages/pull/13800) 起 Ultraplonk 已弃用。若需通过 zkVerify 提交 Noir 证明，请切换到旧版 bbup（推荐 0.76.4），命令：
`bbup -v <version>`
:::

- `verify_proof()` 使用 [ultraplonk_verifier](https://github.com/zkVerify/ultraplonk_verifier/tree/v0.2.0) 验证。可用 [noir-cli](https://github.com/zkVerify/ultraplonk_verifier/tree/main/src/bin/noir_cli) 将 `barretenberg` 生成的产物转换为本 pallet 支持的格式。
