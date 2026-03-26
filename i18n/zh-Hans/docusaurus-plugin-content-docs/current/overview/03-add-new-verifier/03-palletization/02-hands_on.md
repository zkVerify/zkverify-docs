---
title: 实战
---

## 分步指南

### 初始化 Pallet（WASM）

本节仅为 pallet 做文件与目录准备。

步骤如下：

- 在仓库根目录进入 verifiers 目录（`cd verifiers`），执行 `cargo new foo --lib` 创建新 pallet，完成默认文件与目录的脚手架。
- 打开 `verifiers/foo/Cargo.toml`，调整 `package`、`dependencies`、`feature` 等段落，使其类似下方示例：

  ```toml
  [package]
  name = "pallet-foo-verifier"
  version = "0.1.0"
  description = "A foo verifier pallet"
  homepage.workspace = true
  edition.workspace = true
  authors.workspace = true
  repository.workspace = true
  license = "TBD"
  
  [package.metadata.docs.rs]
  targets = ["x86_64-unknown-linux-gnu"]
  
  [dependencies]
  log = "0.4.21"
  hex-literal = { version = "0.4.1", optional = true }
  codec = { workspace = true }
  scale-info = { workspace = true }

  hp-verifiers = { workspace = true }
  pallet-verifiers = { workspace = true }
  
  frame-support = { workspace = true }
  frame-system = { workspace = true }
  frame-benchmarking = { workspace = true, optional = true }
  sp-core = { workspace = true }
  
  foo-verifier = { git = "https://github.com/HorizenLabs/foo-verifier.git", default-features = false, tag = "v0.1.0" }

  [dev-dependencies]
  hex-literal = { version = "0.4.1" }

  [features]
  default = ["std"]
  std = [
      "codec/std",
      "scale-info/std",
      "sp-core/std",
      "frame-support/std",
      "frame-system/std",
      "hp-verifiers/std",
      "pallet-verifiers/std",
  ]
  runtime-benchmarks = [
      "frame-benchmarking/runtime-benchmarks",
      "frame-system/runtime-benchmarks",
      "frame-benchmarking",
      "frame-support/runtime-benchmarks",
      "pallet-verifiers/runtime-benchmarks",
      "dep:hex-literal",
      "dep:sp-runtime",
      "dep:sp-io",
  ]
  ```

  需要按实际情况修改所有 `foo` 相关引用（尤其是 verifier 库，如示例中的 `foo_verifier`）。

:::tip[**Don't get confused with terminology!**]
请勿混淆已有的库 crate（此处为 `foo-verifier`）与本教程正在构建的 pallet crate（`pallet-foo-verifier`）。后文提到 library 与 pallet 时务必区分。
:::

- 在 `verifiers/foo/src` 目录下创建 `weight.rs` 文件，粘贴以下代码：

  ```rust
  #![cfg_attr(rustfmt, rustfmt_skip)]
  #![allow(unused_parens)]
  #![allow(unused_imports)]
  #![allow(missing_docs)]
  
  use frame_support::{traits::Get, weights::{Weight, constants::RocksDbWeight}};
  use core::marker::PhantomData;
  
  pub trait WeightInfo {
      fn submit_proof() -> Weight;
      fn submit_proof_with_vk_hash() -> Weight;
      fn register_vk() -> Weight;
  }
  
  impl WeightInfo for () {
      fn submit_proof() -> Weight {
          Weight::from_parts(1_000_000, 1000)
              .saturating_add(RocksDbWeight::get().reads(3_u64))
              .saturating_add(RocksDbWeight::get().writes(2_u64))
      }
  
      fn submit_proof_with_vk_hash() -> Weight {
          Weight::from_parts(1_000_000, 1000)
              .saturating_add(RocksDbWeight::get().reads(4_u64))
              .saturating_add(RocksDbWeight::get().writes(2_u64))
      }
  
      fn register_vk() -> Weight {
          Weight::from_parts(1_000_000, 0)
              .saturating_add(RocksDbWeight::get().writes(1_u64))
      }
  }
  ```

  这里只是占位权重，便于项目通过编译；之后会通过基准测试生成真实值。
- 在 `verifiers/foo/src` 目录下创建空文件 `benchmarking.rs`、`verifier_should.rs`，分别用于基准测试与单元测试，后续再填充内容。

### 初始化 Pallet（NATIVE）

若选择 NATIVE 集成，沿用上一小节步骤，并做以下调整：

- `verifiers/foo/Cargo.toml` 应类似下方：

  ```toml
  [package]
  name = "pallet-foo-verifier"
  version = "0.1.0"
  description = "A foo verifier pallet"
  homepage.workspace = true
  edition.workspace = true
  authors.workspace = true
  repository.workspace = true
  license = "TBD"
  
  [package.metadata.docs.rs]
  targets = ["x86_64-unknown-linux-gnu"]
  
  [dependencies]
  log = "0.4.21"
  hex-literal = { version = "0.4.1", optional = true }
  codec = { workspace = true }
  scale-info = { workspace = true }

  hp-verifiers = { workspace = true }
  pallet-verifiers = { workspace = true }
  native = { workspace = true }
  
  frame-support = { workspace = true }
  frame-system = { workspace = true }
  frame-benchmarking = { workspace = true, optional = true }
  sp-core = { workspace = true }

  [dev-dependencies]
  hex-literal = { version = "0.4.1" }

  [features]
  default = ["std"]
  std = [
      "codec/std",
      "scale-info/std",
      "sp-core/std",
      "frame-support/std",
      "frame-system/std",
      "hp-verifiers/std",
      "pallet-verifiers/std",
      "native/std",
  ]
  runtime-benchmarks = [
      "frame-benchmarking/runtime-benchmarks",
      "frame-system/runtime-benchmarks",
      "frame-benchmarking",
      "frame-support/runtime-benchmarks",
      "pallet-verifiers/runtime-benchmarks",
      "dep:hex-literal",
      "dep:sp-runtime",
      "dep:sp-io",
  ]
  ```

- 修改 `native/Cargo.toml`，在其他 `*-verifier` 项之后追加：

  ```toml
  foo-verifier = { git = "https://github.com/HorizenLabs/foo-verifier.git", default-features = false, tag = "v0.1.0" }
  ```

区别在于 verifier 库不是 pallet 的依赖，而是作为已有 `native` 库的依赖（下一步会修改）。

### 实现基础 Pallet（WASM）

本节将把 verifier 库真正嵌入对应 pallet。先看高层要做的事：

- 可选：为 verifier 提供配置 trait（若需要配置）。
- 定义 verification key、proof、public inputs 的数据类型，保持与库一致。
- 定义 verifier 结构体，即代表 pallet 的 `struct`（可带泛型）。
- 实现 `Verifier` trait，为尚未定义的成员提供实现，并按需覆盖默认行为。
- 定义 weight 结构体，用于描述 pallet 的权重信息。
- 实现 `WeightInfo` trait，将 runtime 中使用的权重映射到 pallet 提供的权重（基准测试输出）。

具体步骤：

- 清空 `verifiers/foo/lib.rs` 文件内容。

- 在文件开头添加：

  ```rust
  #![cfg_attr(not(feature = "std"), no_std)]
  
  use core::marker::PhantomData;
  use frame_support::weights::Weight;
  use hp_verifiers::Verifier;
  use sp_core::*;
  
  pub mod benchmarking;
  mod verifier_should;
  mod weight;
  pub use weight::WeightInfo;
  ```

- 如需配置 trait，可按如下定义：

  ```rust
  pub trait Config: 'static {
      /// Some parameter for Foo verifier
      type SomeParameter: Get<u8>;
      
      fn get_some_parameter() -> u8 {
          Self::SomeParameter::get()
      }
  }
  ```

  若希望从 runtime 外部配置 pallet 内部参数，则需要此配置。
- verification key、proof、public inputs 的类型定义很直接：与库保持一致即可。示例中分别用 `sp_core::H256`、`[u8; 512]`、`[u8; 32]`。

  ```rust
  pub type Vk = H256;
  pub type Proof = [u8; 512];
  pub type Pubs = [u8; 32];
  ```

- 定义 verifier 结构体时可使用预定义宏：

  ```rust
  #[pallet_verifiers::verifier]
  pub struct Foo<T>;
  ```

  这里的 `struct` 使用泛型以支持上文的配置。如不需要配置，可直接写 `pub struct Foo;`。
- 接下来是最重要的部分，实现 `Verifier` trait。以下成员必须实现：

  - `Vk`,
  - `Proof`,
  - `Pubs`,
  - `hash_context_data`,
  - `verify_proof`,
  - `pubs_bytes`.
  
  其余成员可按需实现（用于覆盖默认行为）：

  - `validate_vk`,
  - `vk_hash`,
  - `vk_bytes`.

  将以下代码追加到 `verifiers/foo/lib.rs`：

  ```rust
  impl<T: Config> Verifier for Foo<T> {
      type Vk = Vk;
      type Proof = Proof;
      type Pubs = Pubs;
  
      fn hash_context_data() -> &'static [u8] {
          b"foo"
      }
  
      fn verify_proof(
          vk: &Self::Vk,
          proof: &Self::Proof,
          pubs: &Self::Pubs,
      ) -> Result<(), hp_verifiers::VerifyError> {
          log::trace!("Verifying proof");
          // a dummy logic for simulating usage of configuration and error raise
          if vk.0[0].saturating_add(proof[0]).saturating_add(pubs[0]) == T::get_some_parameter() {
              return Err(hp_verifiers::VerifyError::VerifyError);
          }
          foo_verifier::verify((*vk).into(), *proof, *pubs)
              .map_err(|_| log::debug!("Cannot verify foo proof"))
              .map_err(|_| hp_verifiers::VerifyError::VerifyError)
      }
  
      fn pubs_bytes(pubs: &Self::Pubs) -> hp_verifiers::Cow<[u8]> {
          hp_verifiers::Cow::Borrowed(pubs)
      }
  
      fn vk_hash(vk: &Self::Vk) -> H256 {
          *vk
      }
  }
  ```

  上述 `verify_proof` 为示例逻辑，请替换为调用自有库 verify 函数的真实实现。

- 定义 weight 结构体时可在同一文件使用：

  ```rust
  pub struct FooWeight<W: weight::WeightInfo>(PhantomData<W>);
  ```

- `WeightInfo` trait 可按下述方式实现：

  ```rust
  impl<T: Config, W: weight::WeightInfo> pallet_verifiers::WeightInfo<Foo<T>> for FooWeight<W> {
      fn submit_proof(
          _proof: &<Foo<T> as hp_verifiers::Verifier>::Proof,
          _pubs: &<Foo<T> as hp_verifiers::Verifier>::Pubs,
      ) -> Weight {
          W::submit_proof()
      }
  
      fn submit_proof_with_vk_hash(
          _proof: &<Foo<T> as hp_verifiers::Verifier>::Proof,
          _pubs: &<Foo<T> as hp_verifiers::Verifier>::Pubs,
      ) -> Weight {
          W::submit_proof_with_vk_hash()
      }
  
      fn register_vk(_vk: &<Foo<T> as hp_verifiers::Verifier>::Vk) -> Weight {
          W::register_vk()
      }
  }
  ```

  如此即可为 `submit_proof`、`submit_proof_with_vk_hash`、`register_vk` 三个 trait 成员提供实现，并一一映射到 `verifiers/foo/src/weight.rs` 中的对应函数。

此时应可无错编译，请在终端运行 `cargo build` 验证，若有错误先修复再继续。

### 实现基础 Pallet（NATIVE）

如为 NATIVE 集成，沿用上一节步骤，并做以下调整：

- 在 `native/lib.rs` 中为 verifier 库提供一层封装，新增模块：

  ```rust
  mod foo;

  pub use foo::foo_verify;
  #[cfg(feature = "std")]
  pub use foo::foo_verify::HostFunctions as FooVerifierHostFunctions;
  ```

  然后在 `pub type HLNativeHostFunctions = (` 中追加 `FooVerifierHostFunctions`。

  最后创建 `native/src/foo.rs`，内容如下：

  ```rust
  use crate::VerifyError;
  use sp_runtime_interface::runtime_interface;
  
  #[cfg(feature = "std")]
  impl From<foo_verifier::VerifyError> for VerifyError {
      fn from(value: foo_verifier::VerifyError) -> Self {
          match value {
              foo_verifier::VerifyError::Failure => VerifyError::VerifyError,
          }
      }
  }
  
  #[runtime_interface]
  pub trait FooVerify {
      fn verify(vk: [u8; 32], proof: &[u8; 512], pubs: &[u8; 32]) -> Result<(), VerifyError> {
          foo_verifier::verify(vk.into(), *proof, *pubs)
              .inspect_err(|_| log::debug!("Cannot verify foo proof"))
              .map_err(Into::into)
              .map(|_| log::trace!("verified"))
      }
  }
  ```

- 修改 `verifiers/foo/src/lib.rs`，在 `verify_proof` 中调用 native 实现。将：

  ```rust
  foo_verifier::verify((*vk).into(), *proof, *pubs)
      .map_err(|_| log::debug!("Cannot verify foo proof"))
      .map_err(|_| hp_verifiers::VerifyError::VerifyError)
  ```

  替换为：

  ```rust
  native::foo_verify::verify((*vk).into(), proof, pubs).map_err(Into::into)
  ```

### 编写测试

本节专注于编写测试，确保代码行为正确。高层需要做：

- 提供测试数据。
- 编写测试，尽量覆盖各种场景。

步骤如下：

- 先准备测试数据。至少要有一组 verification key、proof、public inputs 组成的三元组，可在 `verify_proof` 中验证成功。可再补充更多成功/失败用例。创建 `verifiers/foo/src/resources.rs`，粘贴：

  ```rust
  pub static VALID_VK: sp_core::H256 = sp_core::H256(hex_literal::hex!("0000000000000000000000000000000000000000000000000000000000000001"));
  
  pub static VALID_PROOF: [u8; 512] = hex_literal::hex!("00...02");
  
  pub static VALID_PUBS: [u8; 32] = hex_literal::hex!("0000000000000000000000000000000000000000000000000000000000000003");
  ```
  
  需将上述占位值替换为适用于 verifier 的真实数据。

- 具体测试写在 `verifiers/foo/src/verifier_should.rs`：

  ```rust
  #![cfg(test)]
  
  use super::*;
  
  struct Mock;
  
  pub const SOME_PARAMETER_CONST: u8 = 1;
  
  impl Config for Mock {
      type SomeParameter = ConstU8<SOME_PARAMETER_CONST>; // arbitrary value for tests
  }
  
  include!("resources.rs");
  
  #[test]
  fn verify_valid_proof() {
      assert!(Foo::<Mock>::verify_proof(&VALID_VK, &VALID_PROOF, &VALID_PUBS).is_ok());
  }
  
  mod reject {
      use hp_verifiers::VerifyError;
  
      use super::*;
  
      #[test]
      fn invalid_proof() {
          let mut invalid_pubs = VALID_PUBS.clone();
          invalid_pubs[0] = SOME_PARAMETER_CONST
              .saturating_sub(VALID_VK[0])
              .saturating_sub(VALID_PROOF[0]);
  
          assert_eq!(
              Foo::<Mock>::verify_proof(&VALID_VK, &VALID_PROOF, &invalid_pubs),
              Err(VerifyError::VerifyError)
          )
      }
  }
  ```

  上例通过污染最后一个字节使原本有效的 public inputs 失效；你也可以显式提供失败用例。若有精力，扩充 `reject` 模块以覆盖更多失败场景。

此时应可运行 pallet 测试，可在终端执行 `cargo test --package pallet-foo-verifier` 检查；如有错误先修复再继续。

### 编写基准测试

本节编写基准测试，以便为 runtime 中执行的函数分配合适权重。注意这里仅提供基准测试代码，并不实际运行；要影响链上参数，需要在特定参考硬件上（通常在发布前）执行基准测试。如需协助请在 Discord 联系。

- 打开空的 `verifiers/foo/src/benchmarking.rs`，粘贴以下代码：

  ```rust
  #![cfg(feature = "runtime-benchmarks")]

  use super::Foo;
  use frame_benchmarking::v2::*;
  use frame_system::RawOrigin;
  use hp_verifiers::Verifier;
  use pallet_verifiers::{VkOrHash, Vks};
  
  pub struct Pallet<T: Config>(crate::Pallet<T>);
  
  pub trait Config: crate::Config {}
  impl<T: crate::Config> Config for T {}
  pub type Call<T> = pallet_verifiers::Call<T, Foo<T>>;
  
  include!("resources.rs");
  
  #[benchmarks(where T: pallet_verifiers::Config<Foo<T>>)]
  mod benchmarks {
  
      use super::*;
  
      #[benchmark]
      fn submit_proof() {
          // setup code
          let caller = whitelisted_caller();
          let vk = VALID_VK;
          let proof = VALID_PROOF;
          let pubs = VALID_PUBS;
  
          #[extrinsic_call]
          submit_proof(
              RawOrigin::Signed(caller),
              VkOrHash::from_vk(vk),
              proof.into(),
              pubs.into(),
          );
      }
  
      #[benchmark]
      fn submit_proof_with_vk_hash() {
          // setup code
          let caller = whitelisted_caller();
          let vk = VkOrHash::from_hash(VALID_VK);
          let proof = VALID_PROOF;
          let pubs = VALID_PUBS;
          Vks::<T, Foo<T>>::insert(VALID_VK, VALID_VK);
  
          #[extrinsic_call]
          submit_proof(RawOrigin::Signed(caller), vk, proof.into(), pubs.into());
      }
  
      #[benchmark]
      fn register_vk() {
          // setup code
          let caller = whitelisted_caller();
          let vk = VALID_VK;
  
          #[extrinsic_call]
          register_vk(RawOrigin::Signed(caller), vk.clone().into());
  
          // Verify
          assert!(Vks::<T, Foo<T>>::get(Foo::<T>::vk_hash(&vk)).is_some());
      }
  
      impl_benchmark_test_suite!(Pallet, super::mock::test_ext(), super::mock::Test);
  }
  
  #[cfg(test)]
  mod mock {
      use frame_support::derive_impl;
      use sp_runtime::{traits::IdentityLookup, BuildStorage};
  
    // Configure a mock runtime to test the pallet.
    frame_support::construct_runtime!(
        pub enum Test
        {
            System: frame_system,
            VerifierPallet: crate,
        }
    );

    pub const SOME_PARAMETER: u8 = 1; // arbitrary value

    impl crate::Config for Test {
        type SomeParameter = ConstU8<SOME_PARAMETER>; // arbitrary value
    }

    #[derive_impl(frame_system::config_preludes::SolochainDefaultConfig as frame_system::DefaultConfig)]
    impl frame_system::Config for Test {
        type Block = frame_system::mocking::MockBlockU32<Test>;
        type AccountId = u64;
        type Lookup = IdentityLookup<Self::AccountId>;
    }

    impl pallet_verifiers::Config<crate::Foo<Test>> for Test {
        type RuntimeEvent = RuntimeEvent;
        type OnProofVerified = ();
        type WeightInfo = crate::FooWeight<()>;
    }
  
      /// Build genesis storage according to the mock runtime.
      pub fn test_ext() -> sp_io::TestExternalities {
          let mut ext = sp_io::TestExternalities::from(
              frame_system::GenesisConfig::<Test>::default()
                  .build_storage()
                  .unwrap(),
          );
          ext.execute_with(|| System::set_block_number(1));
          ext
      }
  }
  ```

此时理论上可运行基准测试（但如前所述，不要在本机跑）。目前只需确保它们可编译通过，可在终端执行 `cargo build --features=runtime-benchmarks` 检查；如有错误先修复再继续。
