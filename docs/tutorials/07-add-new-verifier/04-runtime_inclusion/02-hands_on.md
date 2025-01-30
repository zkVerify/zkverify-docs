---
title: Hands On
---

## The Step-By-Step Guide

### Adding the Pallet as a Dependency

The very first thing to do is to add your verifier pallet as a dependency of the runtime.

Follow the steps below:

- In the workspace `Cargo.toml` file (the one located at repository root) modify the `[workspace.dependencies]` section appending the following line just after all the other `pallet-*-verifier` entries:

  ```
  pallet-foo-verifier = { path = "verifiers/foo", default-features = false }
  ```

- In the runtime config file `runtime/Cargo.toml` modify the `[dependencies]` section appending the following line just after all the other `pallet-*-verifier` entries:

  ```
  pallet-foo-verifier = { workspace = true }
  ```

  Then modify the `[features]` section, `runtime-benchmarks` and `std` entries, appending the following lines at the corresponding ends:

  ```
  "pallet-foo-verifier/runtime-benchmarks",
  ```

  ```
  "pallet-foo-verifier/std",
  ```

### Adding Dummy Weights

In a similar way to what you did for the pallet, you need to provide weights for the runtime.  Again, these are just dummy weights for allowing the project to build.  Later, benchmarks will be run for generating proper values.

Proceed by following the steps below:

- Create a file inside the `runtime/src/weights` named `pallet_foo_verifier.rs` and copy-paste the following code into it:

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

- Modify the file `runtime/src/weights.rs` by adding the line below:

  ```rust
  pub mod pallet_foo_verifier;
  ```

### Configuring the Pallet Within the Runtime

Here you are actually embedding your verifier pallet into the zkVerify runtime. Before starting, let's list what you need to do from a high level perspective:

- Implement the specific configuration trait of your verifier (if it requires configuration, otherwise skip it).
- Implement the general configuration trait of the template `pallets/verifiers/src/lib.rs` (this is always required).
- Modify the construction of the runtime so that it includes your pallet.
- Include your pallet into the runtime benchmarks.

Proceed by following the steps below:

- For implementing the specific and general configuration, modify the file `runtime/src/lib.rs` adding the snippet below just after the analogous code for the other verifiers:

  ```rust
  parameter_types! {
      pub const FooSomeParameter: u8 = 1; // arbitrary value
  }
  
  impl pallet_foo_verifier::Config for Runtime {
      type SomeParameter = FooSomeParameter;
  }
  
  impl pallet_verifiers::Config<pallet_foo_verifier::Foo<Runtime>> for Runtime {
      type RuntimeEvent = RuntimeEvent;
      type OnProofVerified = Poe;
      type WeightInfo =
          pallet_foo_verifier::FooWeight<weights::pallet_foo_verifier::ZKVWeight<Runtime>>;
  }
  ```

  If your pallet does not require specific configuration, then you only need to modify the last piece of the above: `impl pallet_verifiers::Config<pallet_foo_verifier::Foo> for Runtime {`.
- To allow your pallet being included during the runtime construction, add this line at the end of the `construct_runtime!` macro:

  ```rust
  SettlementFooPallet: pallet_foo_verifier,
  ```

  :::note
  Even if a one-liner, this step is the most important one.  If missing, you would be able to build the project but in the end your pallet would remain unused.
  :::
- To include your pallet in the runtime benchmarks you need to add the definition `[pallet_foo_verifier, FooVerifierBench::<Runtime>]` at the end of the macro `define_benchmarks!` within module `benches`, then rename `use pallet_foo_verifier::benchmarking::Pallet as FooVerifierBench;` to both `benchmark_metadata` and `dispatch_benchmark` functions.

At this point you should be able to build the source code, and run tests and benchmarks without errors.  Double check this in a single step by submitting command `cargo test --features=runtime-benchmarks` in a terminal. If you encounter any error(s), fix them before proceeding.
