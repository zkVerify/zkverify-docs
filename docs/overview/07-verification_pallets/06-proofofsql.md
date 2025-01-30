---
title: Space and Time Proof of Sql Verifier
---

## [`settlementProofOfSqlPallet`](https://github.com/HorizenLabs/zkVerify/tree/main/verifiers/proofofsql)

### Statement hash components

- context: `keccak256(b"proofofsql")`
- vk: `keccak256(vk.encode())`
- pubs: `keccak256(pubs)`

### `Verifier` implementation
Proof verification is performed by the `verifyProof` method, whose signature is
```rust
fn verify_proof(
    vk: &Self::Vk,
    proof: &Self::Proof,
    pubs: &Self::Pubs,
) -> Result<(), VerifyError>
```

`Self::Vk`, `Self::Proof`, and`Self::Pubs` are raw byte vectors, and are the result of the serialization of the following data structures:
- *Vk*: it contains a [`VerifierSetup`](https://github.com/spaceandtimelabs/sxt-proof-of-sql/blob/0634804dd213f86f10f2510aa82261033f9cf790/crates/proof-of-sql/src/proof_primitive/dory/setup.rs#L115) and the actual value `sigma` used for the parameter `nu` when constructing the proof

    ```rust
    pub struct VerificationKey {
        setup: VerifierSetup,
        sigma: usize,
    }

- *Proof*: it's just a wrapper around a [`VerifiableQueryResult<DoryEvaluationProof>`](https://github.com/spaceandtimelabs/sxt-proof-of-sql/blob/0634804dd213f86f10f2510aa82261033f9cf790/crates/proof-of-sql/src/sql/proof/verifiable_query_result.rs#L70)

    ```rust
    pub struct Proof {
        proof: VerifiableQueryResult<DoryEvaluationProof>,
    }
    ```

- *Pubs*: it contains
    * a [`DynProofPlan<DoryCommitment>`](https://github.com/spaceandtimelabs/sxt-proof-of-sql/blob/0634804dd213f86f10f2510aa82261033f9cf790/crates/proof-of-sql/src/sql/proof_plans/dyn_proof_plan.rs#L11), which is related to the soecific SQL query is being proven
    * a [`QueryCommitments<DoryCommitment>`](https://github.com/spaceandtimelabs/sxt-proof-of-sql/blob/0634804dd213f86f10f2510aa82261033f9cf790/crates/proof-of-sql/src/base/commitment/query_commitments.rs#L18), which is a list of all the column commitments involved in the SQL query being proven
    * a [`QueryData<DoryScalar>`](https://github.com/spaceandtimelabs/sxt-proof-of-sql/blob/0634804dd213f86f10f2510aa82261033f9cf790/crates/proof-of-sql/src/sql/proof/query_result.rs#L48), which is reletad to the result of the SQL query being proven

    ```rust
    pub struct PublicInput {
        expr: DynProofPlan<DoryCommitment>,
        commitments: QueryCommitments<DoryCommitment>,
        query_data: QueryData<DoryScalar>,
    }
    ```

The `proof-of-sql-verifier` library offers method for correctly serializing these data structures, using the functions [`VerificationKey::to_bytes()`](https://github.com/HorizenLabs/proof-of-sql-verifier/blob/d499c6d64915954c033d14dbd2ec937434b8b564/src/verification_key.rs#L84), [`Proof::to_bytes()`](https://github.com/HorizenLabs/proof-of-sql-verifier/blob/d499c6d64915954c033d14dbd2ec937434b8b564/src/proof.rs#L73), and [`PublicInput::try_to_bytes()`](https://github.com/HorizenLabs/proof-of-sql-verifier/blob/d499c6d64915954c033d14dbd2ec937434b8b564/src/pubs.rs#L91).

For a practical example of how to get all the verification key, proof, and public input, please see the source code of the example binary [`generate-sample-proof`](https://github.com/HorizenLabs/proof-of-sql-verifier/blob/main/src/bin/generate-sample-proof.rs) inside `proof-of-sql-verifier` crate.

### Result

The `verify_proof` method returns `Ok(())` if verification is successful, otherwise it returns an error, indicating either unsuccessful proof verification or invalid input data.