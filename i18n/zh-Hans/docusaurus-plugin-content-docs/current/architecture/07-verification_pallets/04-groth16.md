---
title: Groth16 Verifier
---

## [`settlementGroth16Pallet`](https://github.com/zkVerify/zkVerify/tree/main/verifiers/groth16)

### Statement hash components

- context: `keccak256(b"groth16")`
- vk: `keccak256(vk.encode())`
- pubs: `keccak256(pubs)` where pubs are the concatenated scalars bytes

`submitProof` 可用于验证 Groth16 证明。

### `Verifier` implementation

该 verifier 使用 arkworks [`ark-groth16`](https://github.com/arkworks-rs/groth16/tree/v0.4.0) 进行验证，各数据结构的表示与序列化与该库一致。若使用 `ark-groth16` 生成 proof/vk，接入较为直接；若用 `snarkJS`，可用 [`snarkjs2zkv`](https://github.com/HorizenLabs/snarkjs2zkv) 转换；其他工具请参阅[编码](#encodings)。

- `verify_proof()` 负责反序列化 proof 与 public inputs，并用给定 vkey 验证。
- 定义如下类型：

  ```rust
  pub enum Curve {
      Bn254,
      Bls12_381,
  }

  pub struct G1(pub Vec<u8>); // 64 bytes for Bn256 and 96 for Bls12381
  pub struct G2(pub Vec<u8>); // 128 bytes for Bn256 and 192 for Bls12381
  pub struct Scalar(pub Vec<u8>); // 32 bytes

  pub struct ProofInner {
      pub a: G1,
      pub b: G2,
      pub c: G1,
  }

  pub struct Vk {
      pub curve: Curve,
      pub alpha_g1: G1,
      pub beta_g2: G2,
      pub gamma_g2: G2,
      pub delta_g2: G2,
      pub gamma_abc_g1: Vec<G1>,
  }
  pub struct Proof {
      pub curve: Curve,
      pub proof: ProofInner,
  }
  pub type Pubs = Vec<Scalar>;
  ```

- hash 上下文数据为 `b"groth16"`
- `pubs_bytes()` 是将标量字节串联后的结果
  
  ```rust
   pubs.iter()
      .flat_map(|s| s.0.iter().cloned())
      .collect::<Vec<_>>()
  ```

- `validate_vk` 会检查各值以及曲线点合法性

## [Encodings](#encodings)

`Proof`、`Vk`（verification key）与 `Pubs`（public inputs）均由密码学原语组成：椭圆曲线点（`G1`/`G2`）与标量。

- 椭圆曲线点采用未压缩表示，即仿射坐标 `x`、`y` 的编码拼接。
  
  - BN254 基础域元素占 32 字节，因此 BN254 `G1` 点的仿射表示为 `2 * 32 = 64` 字节。`G2` 位于二次扩域，空间翻倍为 128 字节。
  - BLS12-381 基础域元素占 48 字节，因此 BLS12-381 `G1` 编码为 `2 * 48 = 96` 字节，`G2` 为 `2 * 96 = 192` 字节。
  - G1/G2 的 `x`、`y` 坐标：BN254 使用小端编码，BLS12-381 使用大端；与 arkworks 保持一致。
- `Scalars` 采用小端编码；BN254 与 BLS12-381 的标量域元素均可用 32 字节表示。

编码大小总结如下：

| 项目    | BN254    | BLS12-381 |
| ------- | -------- | --------- |
| G1 点   | 64 bytes | 96 bytes  |
| G2 点   | 128 bytes | 192 bytes |
| Scalar  | 32 bytes | 32 bytes  |
