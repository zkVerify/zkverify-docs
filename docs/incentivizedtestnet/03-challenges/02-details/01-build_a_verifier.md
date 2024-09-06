---
title: Build a Verification Pallet
---

### Overview
The goal is to have incentivized testnet participants to build additional verifiers for zkVerify. You can follow the "[Add a New Verifier tutorial](https://docs.zkverify.io/tutorials/add-new-verifier/introduction)" from the zkVerify docs, that covers the basics to add a new verifier to the zkVerify blockchain. 

Also, make sure to take a look at the verifiers we’ve already [integrated](https://github.com/HorizenLabs/zkVerify/tree/main/verifiers), in case you need to include more “exotic” logic (for instance, the possibility to verify on two different elliptic-curves or having runtime benchmarks for different input size categories). For any additional help, feel free to contact the zkVerify team.  

### Scope
From higher to lower priority:

* Halo 2 - KZG & IPA
    * Over bn254 (for Ethereum support) (mandatory) and pasta/bls12381/secp256k1 elliptic curves
    * Objective: verify proofs coming from zkEVMs using Halo 2 as proving system (such as Scroll zkEVM) or zkApps leveraging Halo2
* Plonky2
* Starky
* Gnark
    * Over Bn254 and BLS12-381 curves
* Stwo (Starkware, Cairo)
    * Objective: Support verification of Starkware zkRollup’s proofs as well as generic proofs generated via Cairo programs
* Stone
    * Objective: Support verification of Starkware zkRollup’s proofs as well as generic proofs generated via Cairo programs
* SP1
    * Compressed STARK; PLONK 
* ZKM
    * Plonky2; STARK
* Jolt
    * Lasso
* Kimchi + Pickle
    * Objective: Support verification of Mina’s succinct state proofs as well as proofs generated via O1-JS
* Nova
    * Over “pasta” cycle of elliptic curves
* Supernova 
    * Over “pasta” cycle of elliptic curves

### Requirements and Best Practices

* The programming language should be Rust, the <u><i>latest stable</i></u> version of the toolchain must be used (as to enable direct runtime inclusion via WASM compilation).

* Try to leverage as much as possible already existing and possibly well audited/battle-tested solutions, in case you plan to adopt third party libraries, and make sure that such libraries have some kind of open-source license.

* Add tests for the Verification Library:
    * Tests should cover happy/unhappy paths for proof verification and serialization/deserialization of vk/proof/public inputs. 
    * Include some tests with hardcoded data ideally taken from third-party on-chain/official sources, depending on the use case for which we wish the verifier to be integrated.


* Add tests for the Verification Pallet. Tests should include:
    * Correct inclusion of the pallet in the runtime.
    * Unit tests with mock runtime.
    * Weight tests.
    * Modifications to `zombienet` tests which already tests the other already included verifiers


* Documentation for the newly added verification pallet must be added to zkverify-docs [repository](https://github.com/HorizenLabs/zkverify-docs). Please, follow the same pattern as the [ones](https://docs.zkverify.io/overview/verification_pallets/abstract/) already present.


* An end-to-end tutorial on how to submit proofs for the verifier you’ve just added to the zkVerify blockchain must be provided. For instance, if you are integrating the gnark verifier, make sure to document or reference how to generate gnark proofs using the gnark toolchain.


* Make sure to provide any tool that users might require to transform proofs, vk and public inputs from the chosen source (e.g. Gnark) to the format accepted by the zkVerify blockchain, as provided by your implementation.


* For the submission itself to the zkVerify blockchain, feel free to leverage either the Polkadot JS frontend for submission via copy-paste, or any kind of Javascript/Rust code to do it programmatically. 


* As a reference, take a look at the tutorials we already [have](https://docs.zkverify.io/tutorials/submit-proofs/typescript-example) in our documentation.

### Acceptance Criteria and Submission


* Implementations with “no-std” (thus compilable in WASM and directly includible in the runtime) are preferred over “native” ones.


* Code must compile and CI must pass. Take a look at the [instructions](https://github.com/HorizenLabs/zkVerify?tab=readme-ov-file#running-github-workflows-on-local-environment) on how to run the CI locally for more information. If you require the CI to install some dependencies, feel free to modify it. Otherwise reach the team for further support.


* Try to make sure that compilation time is not “highly impacted” by the inclusion of your verifier (e.g. if you are including heavy dependencies). The zkVerify team, upon review, might decide to reject your implementation.


* Branch from the “<i>main</i>” branch for your implementation. Give the branch a meaningful name, ideally "<i>\<verifier_name>-verifier</i>".

* Open a PR in the [zkVerify repository](https://github.com/HorizenLabs/zkVerify) targeted against the “<i>main</i>” branch. Make sure that throughout the review process your branch stays up-to-date with the “<i>main</i>” branch. If not, align it exclusively via git rebase.

* All the commits must be signed.

* Make sure the CI passes. If not, apply your fixes and contact the team that will trigger an additional CI run.

* [Documentation & Tutorial] Open a PR in the zkVerify [documentation repository](https://github.com/HorizenLabs/zkverify-docs) against the main branch.

* PRs will be reviewed by at least 2 members of the zkVerify team. Please make sure to be responsive during the review phase. 


### Application process
To participate in this challenge we kindly ask you to complete an application [form](https://forms.gle/idYKZ8n7T21embgLA). We're looking for developers with a strong background in cryptography, blockchain technology, and preferably experience with zero-knowledge proofs. Please provide detailed information about your relevant past projects and any specific verifier implementations you're interested in or have expertise with. 

Our team will carefully review all applications to ensure a fair and efficient distribution of tasks. This vetting process allows us to avoid duplication of work and ensures that we don't have multiple participants working on the same verifier, as we will only award one implementation per verifier type. 


