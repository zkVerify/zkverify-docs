---
title: Build a Verification Pallet
---

### Overview
Following the initial response to our verifier-building initiative, we're proud to announce that several verifiers are already under active development! But there's still plenty of opportunity to contribute - we have an updated list of verifiers that need to be built, which you can find below. 

To get started, check out our "[Add a New Verifier tutorial](https://docs.zkverify.io/tutorials/add-new-verifier/introduction)" in the zkVerify docs, which walks you through the basics of adding a new verifier to the zkVerify blockchain.

Also, before you begin, we recommend reviewing our [existing verifier implementations](https://github.com/HorizenLabs/zkVerify/tree/main/verifiers), especially if you need to incorporate advanced functionality like verification across multiple elliptic curves or runtime benchmarking for different input sizes. 

The zkVerify team is always here to help if you need guidance along the way. Find us on [Discord](https://discord.com/invite/zkverify).

### Scope
From higher to lower priority:

* Stwo (Starkware, Cairo)
    * Objective: Support verification of Starkware zkRollup’s proofs as well as generic proofs generated via Cairo programs
* Stone
    * Objective: Support verification of Starkware zkRollup’s proofs as well as generic proofs generated via Cairo programs
* Jolt
* Kimchi + Pickle
    * Objective: Support verification of Mina’s succinct state proofs as well as proofs generated via O1-JS
* Supernova 
    * Over “pasta” cycle of elliptic curves
* Starky

### Requirements and Best Practices

* The programming language should be Rust, the <u><i>latest stable</i></u> version of the toolchain must be used (as to enable direct runtime inclusion via WASM compilation).

* Try to leverage as much as possible already existing and possibly well audited/battle-tested solutions, in case you plan to adopt third party libraries, and make sure that such libraries have some kind of open-source license.

* Implementations with “no-std” (thus compilable in WASM and directly includible in the runtime) are <u>required</u>
    * The rationale behind this is that we want to keep the flexibility to upgrade the verifiers without having to fork the chain. If you can’t get away with “no-std” you can try to put only low-level libraries in the node (Rust), and keep the business logic in the runtime (WASM, no-std).
        * This is the rationale we adopted, for instance, for our [Risc0](https://github.com/zkVerify/zkVerify/blob/main/native/src/risc0.rs) and [Ultraplonk-Noir](https://github.com/zkVerify/zkVerify/blob/main/native/src/ultraplonk.rs) verifiers.
    * If nothing else works, another acceptable (though with more effort) solution, is rewriting the verifier from scratch and making sure it supports no-std.

* Proper benchmarks are extremely important. If the execution time of your verifier is not fixed and dependent on some parameters (e.g. size of the circuit, proving system configuration, etc.) be sure to capture it properly in the benchmarks. See some examples of such a situation for [Risc0](https://github.com/zkVerify/zkVerify/blob/main/verifiers/risc0/src/benchmarking.rs) verifier and [Ultraplonk-Noir](https://github.com/zkVerify/zkVerify/blob/main/verifiers/ultraplonk/src/benchmarking.rs) verifier.

* We don’t want to depend on forks of external repositories so if, for any reason, you are not able to work with a given original repository (e.g. because it doesn’t have support for no_std for the verifier), and thus you are forced to fork it, we require you to be able to open a PR to the original repo integrating the changes you’ve made.

* Please keep in mind that we have 5MB maximum block space and 1.5s of maximum execution time per block. If you think your verifier artifacts will take more space and the verification will be higher than 1.5 seconds please reach us immediately.

* Add tests for the Verification Library:
    * Tests should cover happy/unhappy paths for proof verification and serialization/deserialization of vk/proof/public inputs. 
    * Include some tests with hardcoded data ideally taken from third-party on-chain/official sources, depending on the use case for which we wish the verifier to be integrated.


* Add tests for the Verification Pallet. Tests should include:
    * Correct inclusion of the pallet in the runtime.
    * Unit tests with mock runtime.
    * Weight tests.
    * Modifications to e2e tests which already tests the other already included verifiers.


* Documentation for the newly added verification pallet must be added to zkverify-docs [repository](https://github.com/HorizenLabs/zkverify-docs). Please, follow the same pattern as the [ones](https://docs.zkverify.io/overview/verification_pallets/abstract/) already present.


* An end-to-end tutorial on how to submit proofs for the verifier you’ve just added to the zkVerify blockchain must be provided. For instance, if you are integrating the gnark verifier, make sure to document or reference how to generate gnark proofs using the gnark toolchain.


* Make sure to provide any tool that users might require to transform proofs, vk and public inputs from the chosen source (e.g. Gnark) to the format accepted by the zkVerify blockchain, as provided by your implementation.


* For the submission itself to the zkVerify blockchain, feel free to leverage either the Polkadot JS frontend for submission via copy-paste, or any kind of Javascript/Rust code to do it programmatically. 


* As a reference, take a look at the tutorials we already [have](https://docs.zkverify.io/tutorials/submit-proofs/typescript-example) in our documentation.

### Acceptance Criteria and Submission

* Code must compile and CI must pass. Take a look at the [instructions](https://github.com/HorizenLabs/zkVerify?tab=readme-ov-file#running-github-workflows-on-local-environment) on how to run the CI locally for more information. If you require the CI to install some dependencies, feel free to modify it. Otherwise reach the team for further support.

* Try to make sure that compilation time is not “highly impacted” by the inclusion of your verifier (e.g. if you are including heavy dependencies). The zkVerify team, upon review, might decide to reject your implementation.
    * Be sure to pin the version of your dependencies as to avoid unwanted updates of the Cargo.lock

* Branch from the “<i>main</i>” branch for your implementation. Give the branch a meaningful name, ideally "<i>\<verifier_name>-verifier</i>".

* Open a PR in the [zkVerify repository](https://github.com/HorizenLabs/zkVerify) targeted against the “<i>main</i>” branch. Make sure that throughout the review process your branch stays up-to-date with the “<i>main</i>” branch. If not, align it exclusively via git rebase.

* All the commits must be signed.

* Make sure the CI passes. If not, apply your fixes and contact the team that will trigger an additional CI run.

* [Documentation & Tutorial] Open a PR in the zkVerify [documentation repository](https://github.com/HorizenLabs/zkverify-docs) against the main branch.

* PRs will be reviewed by at least 2 members of the zkVerify team. Please make sure to be responsive during the review phase. 


### Application process
To participate in this challenge we kindly ask you to complete an [application form](https://forms.gle/idYKZ8n7T21embgLA). We're looking for developers with a strong background in cryptography, blockchain technology, and preferably experience with zero-knowledge proofs. Please provide detailed information about your relevant past projects and any specific verifier implementations you're interested in or have expertise with. 

Our team will carefully review all applications to ensure a fair and efficient distribution of tasks. This vetting process allows us to avoid duplication of work and ensures that we don't have multiple participants working on the same verifier, as we will only award one implementation per verifier type. 


