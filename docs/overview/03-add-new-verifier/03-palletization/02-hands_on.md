---
title: Hands On
---

## The Step-By-Step Guide

### Initializing the Pallet (WASM)

Here you are just preparing the files and directories for your pallet.

The steps to follow are:

- From repository root, navigate to verifiers directory (`cd verifiers`) and create your new pallet with the command `cargo new foo --lib`.  This will perform a scaffolding of default files and directories.
- Open the file `verifiers/foo/Cargo.toml` and adapt sections `package`, `dependencies` and `feature` so that it looks similar to the snippet below:

  ```
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

  Make sure to modify all the references to `foo` (especially the one related to your verifier library, `foo_verifier` in this example) as per your needs.

:::tip[**Don't get confused with terminology!**]
Take care to not confuse the library crate (`foo-verifier` here) you already have and the pallet crate you are building in this tutorial (`pallet-foo-verifier` here). Throughout the tutorial it is important to keep in mind this distinction when referring to library and pallet.
:::

- Inside `verifiers/foo/src` directory create a file named `weight.rs` and copy-paste the following code into it:

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

  It contains just dummy weights for allowing the project to build.  Later benchmarks will be run for generating proper values.
- Inside the `verifiers/foo/src` directory create two empty files named `benchmarking.rs` and `verifier_should.rs`, for running the benchmarks and for running the tests.  You will fill in those files later.

### Initializing the Pallet (NATIVE)

In the case of a NATIVE integration, follow all the steps in the previous paragraph with the following adaptations:

- The file `verifiers/foo/Cargo.toml` should look similar to the snippet below:

  ```
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

- Modify the file `native/Cargo.toml` appending the following line after all the other `*-verifier` entries:

  ```
  foo-verifier = { git = "https://github.com/HorizenLabs/foo-verifier.git", default-features = false, tag = "v0.1.0" }
  ```

Here the difference is that your verifier library is not included as a dependency of the pallet, but rather as a dependency of the already available `native` library which you are going to modify in the next step.

### Implementing the Base Pallet (WASM)

Here you are actually embedding your verifier library into the associated pallet. Before starting, let's list what you need to do from a high level perspective:

- Optionally provide a configuration trait for your verifier (if it supports configuration).
- Define the data types for verification key, proof and public inputs accordingly to those required by your library.
- Define your verifier structure - this means defining a `struct` (eventually parameterized) that actually represents your pallet.
- Implement the `Verifier` trait - this means providing an implementation for all the members of the trait still undefined and possibly override those proposing a generic default.
- Define your weight structure - this means defining a `struct` that actually represents the weight info for your pallet.
- Implement the `WeightInfo` trait - this means providing a mapping between the weight used by the runtime and the weights provided by your pallet (as benchmark outputs).

The steps to follow are:

- Erase the contents of the `verifiers/foo/lib.rs` file.

- Add these lines to the top of it:

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

- Optionally you can provide a configuration trait by defining it in the following way:

  ```rust
  pub trait Config: 'static {
      /// Some parameter for Foo verifier
      type SomeParameter: Get<u8>;
      
      fn get_some_parameter() -> u8 {
          Self::SomeParameter::get()
      }
  }
  ```

  This is required if you want to externally configure (from the runtime) some parameters that are internally used by your pallet.
- The definition of the data types for verification key, proof and public inputs are straightforward - just use the same types required by your library, assigning them accordingly to those required by your library. In the example below they are implemented as `sp_core::H256`, `[u8; 512]` and `[u8; 32]`.

  ```rust
  pub type Vk = H256;
  pub type Proof = [u8; 512];
  pub type Pubs = [u8; 32];
  ```

- For defining your verifier structure you can leverage a predefined macro:

  ```rust
  #[pallet_verifiers::verifier]
  pub struct Foo<T>;
  ```

  Note here the `struct` is templatized for supporting the configuration mentioned above.  In the case that your pallet is not going to support configuration, simply write `pub struct Foo;`.
- It's now time for the most significant part, the implementation of the `Verifier` trait. It is mandatory to provide code for the following members:

  - `Vk`,
  - `Proof`,
  - `Pubs`,
  - `hash_context_data`,
  - `verify_proof`,
  - `pubs_bytes`.
  
  It is optional to provide code for the other members (in this case overriding the default behavior):

  - `validate_vk`,
  - `vk_hash`,
  - `vk_bytes`.

  Append the snippet below to the `verifiers/foo/lib.rs` file:

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

  In the code above the `verify_proof` function is trivial.  You should replace it with proper logic using the verify function of your library.

- For defining your weight structure you can use this code, still in the `verifiers/foo/lib.rs` file:

  ```rust
  pub struct FooWeight<W: weight::WeightInfo>(PhantomData<W>);
  ```

- The implementation of the `WeightInfo` trait can be achieved in the following way:

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

  In this way you are providing an implementation for the three trait members `submit_proof`, `submit_proof_with_vk_hash` and `register_vk`, mapping them 1-to-1 to the associated functions contained in `verifiers/foo/src/weight.rs`.

At this point you should be able to build the project without errors; double check this by submitting command `cargo build` in a terminal. If you encounter an error, fix it before proceeding to the next paragraph.

### Implementing the Base Pallet (NATIVE)

In the case of a NATIVE integration, follow all the steps in the previous paragraph with the following adaptations:

- Provide a wrapper around your verifier library by modifying the existing file `native/lib.rs` so that a new module is defined:

  ```rust
  mod foo;

  pub use foo::foo_verify;
  #[cfg(feature = "std")]
  pub use foo::foo_verify::HostFunctions as FooVerifierHostFunctions;
  ```

  And then append to `pub type HLNativeHostFunctions = (` the new definition `FooVerifierHostFunctions`.

  Finally, create a new file `native/src/foo.rs` containing this code:

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

- Modify the file `verifiers/foo/src/lib.rs` so that inside function `verify_proof` the native implementation is used. Replace:

  ```rust
  foo_verifier::verify((*vk).into(), *proof, *pubs)
      .map_err(|_| log::debug!("Cannot verify foo proof"))
      .map_err(|_| hp_verifiers::VerifyError::VerifyError)
  ```

  With:

  ```rust
  native::foo_verify::verify((*vk).into(), proof, pubs).map_err(Into::into)
  ```

### Writing Tests

This paragraph is dedicated to writing tests to ensure your code behaves properly. Before starting, let's list what you need to do from a high level perspective:

- Provide some test data for the tests.
- Write the tests trying to cover all the possible cases.

Follow the steps below:

- First, you have to provide some test data to feed your tests. The minimum required would be a triplet verification key, proof, public inputs returning success when submitted to function `verify_proof`.  Then you can provide additional successful triplets and also failing triplets to test negative results. To do this, create a new file at `verifiers/foo/src/resources.rs` and copy-paste the following code:

  ```rust
  pub static VALID_VK: sp_core::H256 = sp_core::H256(hex_literal::hex!("0000000000000000000000000000000000000000000000000000000000000001"));
  
  pub static VALID_PROOF: [u8; 512] = hex_literal::hex!("00...02");
  
  pub static VALID_PUBS: [u8; 32] = hex_literal::hex!("0000000000000000000000000000000000000000000000000000000000000003");
  ```
  
  You have to replace the dummy values above with values suitable for your verifier.

- The actual tests can be written in the file `verifiers/foo/src/verifier_should.rs`:

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

  In the example above, some valid public inputs have been invalidated by polluting the last byte.  As mentioned above, you can explicitly provide test data for failure if you prefer. If possible expand the `reject` module in order to cover in the best way all the possible cases of failure.

At this point you should be able to run the tests for your pallet.  Double check this by submitting the command `cargo test --package pallet-foo-verifier` in a terminal. In case you encounter an error, fix it before proceeding to the next paragraph.

### Writing Benchmarks

This paragraph is dedicated to writing benchmarks, so that correct weights can be assigned to functions executed within the runtime. It's important to understand that here you are providing code for the benchmarks, but you are not actually running them.  In order to have a meaningful effect on the blockchain, they need to be run on specific reference hardware (and generally just before a relase is cut).  Please reach out via Discord for assistance here.

- Open the empty file `verifiers/foo/src/benchmarking.rs` and copy-paste this code:

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

At this point you should be theoretically able to run the benchmarks (but as mentioned above, you should not do this on your local machine). Instead of actually running them you should just make sure they build without errors.  Double check this by submitting command `cargo build --features=runtime-benchmarks` in a terminal. In case you encounter an error, fix it before proceeding to the next paragraph.
