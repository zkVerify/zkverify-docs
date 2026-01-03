---
title: 实战
---

## 分步指南

### 将 Pallet 添加为依赖

首先要把 verifier pallet 加到 runtime 依赖中。

步骤如下：

- 在工作区 `Cargo.toml`（仓库根目录）中，找到 `[workspace.dependencies]` 段，在其他 `pallet-*-verifier` 条目后追加：

  ```toml
  pallet-foo-verifier = { path = "verifiers/foo", default-features = false }
  ```

- 在 runtime 配置 `runtime/Cargo.toml` 中，修改 `[dependencies]` 段，在其他 `pallet-*-verifier` 条目后追加：

  ```toml
  pallet-foo-verifier = { workspace = true }
  ```

  然后修改 `[features]` 中的 `runtime-benchmarks` 与 `std` 条目，在末尾分别追加：

  ```toml
  "pallet-foo-verifier/runtime-benchmarks",
  ```

  ```toml
  "pallet-foo-verifier/std",
  ```

### 添加占位权重

与 pallet 类似，runtime 也需要权重配置。此处同样为占位权重，便于编译，之后会跑基准测试生成真实值。

步骤如下：

- 在 `runtime/src/weights` 下创建 `pallet_foo_verifier.rs`，粘贴：

  ```rust
  # ![cfg_attr(rustfmt, rustfmt_skip)]
  
  # ![allow(unused_parens)]
  
  # ![allow(unused_imports)]
  
  # ![allow(missing_docs)]
  
  use frame_support::{traits::Get, weights::{Weight, constants::RocksDbWeight}};
  use core::marker::PhantomData;
  
  /// Weights for `pallet_fflonk_verifier` using the zkVerify node and recommended hardware.
  pub struct ZKVWeight<T>(PhantomData<T>);
  
  impl<T: frame_system::Config> pallet_foo_verifier::WeightInfo for ZKVWeight<T> {
      fn submit_proof() -> Weight {
          Weight::from_parts(1_000_000, 1000)
              .saturating_add(T::DbWeight::get().reads(3_u64))
              .saturating_add(T::DbWeight::get().writes(2_u64))
      }
  
      fn submit_proof_with_vk_hash() -> Weight {
          Weight::from_parts(1_000_000, 1000)
              .saturating_add(T::DbWeight::get().reads(4_u64))
              .saturating_add(T::DbWeight::get().writes(2_u64))
      }
  
      fn register_vk() -> Weight {
          Weight::from_parts(1_000_000, 0)
              .saturating_add(T::DbWeight::get().writes(1_u64))
      }
  }
  ```

- 修改 `runtime/src/weights.rs`，添加：

  ```rust
  pub mod pallet_foo_verifier;
  ```

### 在 Runtime 中配置 Pallet

本节将 verifier pallet 嵌入 zkVerify runtime。高层需完成：

- 实现 verifier 的特定配置 trait（如需配置，否则跳过）。
- 实现模板 `pallets/verifiers/src/lib.rs` 的通用配置 trait（必需）。
- 修改 runtime 构建以包含该 pallet。
- 将 pallet 纳入 runtime 基准测试。

按以下步骤执行：

- 为实现特定与通用配置，修改 `runtime/src/lib.rs`，在其他 verifier 的类似代码后追加：

  ```rust
  parameter_types! {
      pub const FooSomeParameter: u8 = 1; // arbitrary value
  }
  
  impl pallet_foo_verifier::Config for Runtime {
      type SomeParameter = FooSomeParameter;
  }
  
  impl pallet_verifiers::Config<pallet_foo_verifier::Foo<Runtime>> for Runtime {
      type RuntimeEvent = RuntimeEvent;
      type OnProofVerified = Aggregate;
      type WeightInfo =
          pallet_foo_verifier::FooWeight<weights::pallet_foo_verifier::ZKVWeight<Runtime>>;
  }
  ```

  若 pallet 无需特定配置，仅需保留最后一段 `impl pallet_verifiers::Config<pallet_foo_verifier::Foo> for Runtime {` 即可。
- 为在 runtime 构建时包含该 pallet，在 `construct_runtime!` 宏末尾添加：

  ```rust
  SettlementFooPallet: pallet_foo_verifier,
  ```

  :::note
  虽只是一行，但这是最关键的一步。缺失时项目仍可编译，但 pallet 实际未被使用。
  :::
- 要将 pallet 纳入 runtime 基准测试，在 `benches` 模块的 `define_benchmarks!` 宏末尾添加 `[pallet_foo_verifier, FooVerifierBench::<Runtime>]`，并在 `benchmark_metadata`、`dispatch_benchmark` 函数中使用 `use pallet_foo_verifier::benchmarking::Pallet as FooVerifierBench;`。

此时应可构建代码并无误运行测试、基准测试。可在终端执行 `cargo test --features=runtime-benchmarks` 一并验证；如有错误先修复再继续。
