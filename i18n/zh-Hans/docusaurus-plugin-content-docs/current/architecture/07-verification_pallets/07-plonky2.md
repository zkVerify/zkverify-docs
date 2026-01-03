---
title: Plonky2 Verifier
---

## [`settlementPlonky2Pallet`](https://github.com/zkVerify/zkVerify/tree/main/verifiers/plonky2)

### Statement hash components

- context: `keccak256(b"plonky2")`
- vk: `keccak256(vk.encode())`
- pubs: `keccak256(pubs)`

### `Verifier` 实现

假设已构建好 `plonky2` 电路并生成证明：

```rust
let data = builder.build::<C>();

let proof = data.prove(pw)?;
```

#### Verification Key

`Plonky2` 需 `GateSerializer` 序列化 `VerifierCircuitData`，请使用 `ZKVerifyGateSerializer`，反序列化亦基于此。

```rust
use plonky2_verifier::ZKVerifyGateSerializer;

let vk_bytes = data
    .verifier_data()
    .to_bytes(&ZKVerifyGateSerializer)?;
```

#### Proof

```rust
let mut proof_bytes = Vec::new();
proof_bytes.write_proof(&proof.proof)?;
```

#### Public Inputs

`Plonky2` 将 Proof 与 Pubs 放在一个结构中，zkVerify 需拆分。

```rust
let mut pubs_bytes = Vec::new();
pubs_bytes.write_usize(proof.public_inputs.len())?;
pubs_bytes.write_field_vec(proof.public_inputs.as_slice())?;
```

#### Config

`Plonky2` 的 plonk 配置基于泛型（哈希算法、field 等，见 [config.rs](https://github.com/0xPolygonZero/plonky2/blob/main/plonky2/src/plonk/config.rs)）。zkVerify 仅支持两种预设：`Keccak + Goldilocks` 与 `Poseidon + Goldilocks`。

因此 `Vk` 使用自定义 JSON 格式：

```json
{
    "config": "Poseidon",
    "bytes": "392093829392..."
}
```

其中 `bytes` 为上述 `vk_bytes` 的十六进制编码，`config` 仅可取 `Keccak` 或 `Poseidon`。

可使用提供的 `CLI` 工具将 `Vk` 转成 zkVerify 支持的格式，参阅 [plonky2-converter](https://github.com/zkVerify/plonky2-verifier/tree/main?tab=readme-ov-file#plonky2-converter)。

### Result

若 proof 无法反序列化（`InvalidProofData`）或验证失败（`VerifyError`），`submitProof` extrinsic 会报错。
