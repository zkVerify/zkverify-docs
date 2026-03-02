---
title: TEE Verifier
---

## [`settlementTeePallet`](https://github.com/zkVerify/zkVerify/tree/main/verifiers/tee)

### Statement hash components

- context: `keccak256(b"tee")`
- vk: `keccak256(vk.encode())`
- pubs: `keccak256(pubs)`

### `Verifier` implementation

This pallet implements a verifier for Trusted Execution Environment (TEE) attestation quotes, specifically targeting Intel TDX (Trust Domain Extensions). It verifies that a given attestation quote is authentic and was produced by a genuine TEE.

The verification flow works as follows:
1. Parses the TEE attestation quote from the proof bytes
2. Parses the TCB (Trusted Computing Base) info response from the verification key
3. Checks TCB validity at the current timestamp
4. Retrieves the Certificate Revocation List (CRL) from `pallet-crl` (using the `CrlProvider` trait with CA name `"Intel_SGX_Processor"`)
5. Verifies the attestation quote against the TCB info and CRL

- `verify_proof()` parses and validates the attestation quote against the TCB info and certificate chain provided in the verification key.
- `validate_vk()` deserializes the TCB response JSON and verifies the TCB response signature using the provided certificates against the CRL.
- Define the following types:

  ```rust
  pub type Proof = Vec<u8>;  // TEE attestation quote, max 8192 bytes
  pub type Pubs = Vec<u8>;   // Max 0 bytes — not used
  pub struct Vk {
      pub tcb_response: Vec<u8>,   // TCB info JSON response, max 8192 bytes
      pub certificates: Vec<u8>,   // PEM-encoded certificate chain for TCB signature verification, max 8192 bytes
  }
  ```

- hash context data is `b"tee"`
- public inputs are not used (`MAX_PUBS_LENGTH = 0`)

#### Encoding

- The `tcb_response` field should contain the JSON response body as returned by the [Intel Trusted Services TCB Info API](https://api.portal.trustedservices.intel.com/content/documentation.html).
- All certificates and certificate chains are expected to be PEM encoded.

#### CRL Integration

The TEE verifier depends on `pallet-crl`, which manages Certificate Revocation Lists on-chain. The CRL pallet provides certificate revocation data via the `CrlProvider` trait, enabling the TEE verifier to check that certificates in the attestation chain have not been revoked.
