---
title: risc0 Verifier
---

## [`settlementRisc0Pallet`](https://github.com/zkVerify/zkVerify/tree/main/verifiers/risc0)

### Statement hash components

- context: `keccak256(b"risc0")`
- vk: `vk`
- pubs: `keccak256(pubs)`

### `Verifier` implementation

这是 zk-STARK 证明验证器，证明某段代码正确执行并产出结果。代码通过 image_id（验证过程中作为 vkey）进行认证，运行于 risc0-zkVM，receipt 内含原始 proof 与 public inputs（risc0 中称 journal）。

- `verify_proof()` 使用 [`risc0-verifier` crate](https://github.com/HorizenLabs/risc0-verifier) 反序列化 proof 与 public inputs，并根据 vkey 验证。
- 定义如下类型：

  ```rust
  pub enum Proof {
      V2_1(Vec<u8>),
      V2_2(Vec<u8>),
      V2_3(Vec<u8>),
      V3_0(Vec<u8>),
  };
  pub type Pubs = Vec<u8>;
  pub type Vk = H256;
  ```

  组件格式：

- `Proof`：risc0 `InnerProof` 由 `ciborium::into_writer` 序列化，并按版本封装对应枚举；2.x 版本使用 `Proof::V2_x`。
- `Pubs` 公共输入：risc0 `Journal::bytes`
- `Vk` 验证 key：32 字节数组；risc0 `image_id`（长度 8 的整型数组）需大端转换。

- hash 上下文：`b"risc0"`
- `pubs_bytes()` 直接返回输入的字节。
- `vk_hash()` 直接返回传入的 vkey；由于无法获取 vkey 原像，此处不会调用 `vk_bytes()`。
- `verifier_version_hash` 返回字符串 `"risc0:v<x>"` 的 `SHA256`，其中 `<x>` 为版本号：
  - `Proof::V2_1`: `sha256("risc0:v2.1")="0x545aa3fbe4f28bf5be6831341c3d5ba87b16f10089f8efbcc140060e06fb508b"`
  - `Proof::V2_2`: `sha256("risc0:v2.2")="0xb3321f8b04ee9a754860a415c691f00756990e2054e5023f1a68c260a7042efe"`
  - `Proof::V2_3`: `sha256("risc0:v2.3")="0x09c82225a1a8d085090e5169383d874fcca7a340517654659c4eb6fd105e79ec"`
  - `Proof::V3_0`: `sha256("risc0:v3.0")="0xaa24368f9ce9025f58596d966209fc3f322c8cac37dae753bb9b0367d273700d"`

#### Note

在本 pallet 中无需注册 verification key，因为 `vk_hash()` 本身就是 identity。

### Result

该 pallet 借助 [`risc0-verifier` crate](https://github.com/HorizenLabs/risc0-verifier) 完成验证，核心工作如下：

```rust
assert!(risc0_verifier::verify(vk, &proof, &pubs).is_ok());
```

若 proof 或 public inputs 无法反序列化（`InvalidProofData`、`InvalidInput`）或验证失败（`VerifyError`），`submitProof` extrinsic 会报错。
