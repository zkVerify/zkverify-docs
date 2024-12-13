---
title: Fflonk Verifier
---

## [`settlementFflonkPallet`](https://github.com/HorizenLabs/zkVerify/tree/main/verifiers/fflonk)

### Statement hash components

- context: `keccak256(b"fflonk")`
- vk: `keccak256(vk.encode())`
- pubs: `keccak256(pubs)`

### `Verifier` implementation

- `verify_proof()` uses [`fflonk_verifier` crate](https://github.com/HorizenLabs/fflonk_verifier/tree/v0.4.0) to deserialize
the proof and public inputs and then verify them against the given verification key.
- Define the following types:

    ```rust
    pub type Pubs = [u8; 32];
    pub type Proof = [u8; 768];
    pub struct Vk {
        power: u8,
        k1: Fr,
        k2: Fr,
        w: Fr,
        w3: Fr,
        w4: Fr,
        w8: Fr,
        wr: Fr,
        x2: G2,
        c0: G1, 
    }
    
    pub struct Fr(U256)
    pub struct Fq(U256)
    pub struct Fq2(Fq, Fq)
    pub struct G1(Fq, Fq, Fq)
    pub struct G2(Fq2, Fq2, Fq2)
    ```

- hash context data is `b"fflonk"`
- the pubs bytes are the input ones
- `validate_vk` checks the fields value and curve points.

You can fill all the fields with both hex or decimal string: an example from _Polkadot.js_ interface follows:

![Fflonk registerVk](../img/fflonk_register_vk.png)

### Result

The pallet's verification duties are summarized in the following code snippet:

```rust
let proof = Proof::try_from(&proof_data).unwrap();
let pubs = pubs_data.into();
let vk = vk.into();

fflonk_verifier::verify(vk, &proof, &pubs)
```

The `submitProof` exstrinsic can fail both if it's not possible to deserialize the proof (`InvalidProofData`) or if the proof doesn't
verify (`VerifyError`).
