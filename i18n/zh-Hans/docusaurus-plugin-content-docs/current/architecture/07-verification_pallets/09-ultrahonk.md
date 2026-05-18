---
title: Ultrahonk Verifier
---

## [`settlementUltrahonkPallet`](https://github.com/zkVerify/zkVerify/tree/main/verifiers/ultrahonk)

### Statement hash components

- context: `keccak256(b"ultrahonk")`
- vk: `keccak256(vk.encode())`
- pubs: `keccak256(pubs)`

### Supported versions

The pallet accepts proofs wrapped in a `VersionedProof` / `VersionedVk` enum.
The variant selects both the verification backend and the statement-hash
encoding.

| Variant  | Backend    | VK hash                  | `verifier_version_hash`        | When to use                                                                                                                                                                                                |
| -------- | ---------- | ------------------------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `V0_84`  | `bb` v0.84 | `keccak256(SCALE(vk))`   | `sha256("ultrahonk:v0.84")`    | New integrations that still produce proofs with `bb` v0.84.                                                                                                                                                |
| `V3_0`   | `bb` v3.x  | `keccak256(SCALE(vk))`   | `sha256("ultrahonk:v3.0")`     | New integrations on the current `bb` toolchain.                                                                                                                                                            |
| `Legacy` | `bb` v0.84 | `sha256(vk_bytes)`       | `NO_VERSION_HASH` (zero hash)  | Integrations that submitted UltraHonk proofs before versioning was introduced and need the **same statement hash** as before, so their existing on-chain (e.g. Solidity) contracts keep working unchanged. |

`Legacy` is a backward-compatibility shim: same proof payload format and
same verifier as `V0_84`, but the VK bytes are hashed with SHA2-256 of the
raw VK (no enum prefix) and the verifier-version component of the statement
hash is zeroed out — exactly matching what the pallet emitted prior to
runtime `v1.6.0`. Any new integration should pick `V0_84` or `V3_0` instead.

### `Verifier` 实现

该 pallet 验证由 [barretenberg](https://github.com/AztecProtocol/aztec-packages/tree/master/barretenberg) 生成的 UltraHonk 证明（Aztec 工具链）。[Noir](https://noir-lang.org/docs) 编译器以其为后端生成 UltraHonk zk-SNARK，生成证明使用 [nargo](https://noir-lang.org/docs/getting_started/installation/)。当前限制：
1. 仅支持 `bb` 生成的 zk 版证明；
2. 仅支持 Keccak256 作为 transcript 哈希；
3. 不支持递归。

- `verify_proof()` 使用 [ultrahonk_verifier](https://github.com/zkVerify/ultrahonk_verifier/tree/v0.1.0) 验证。
