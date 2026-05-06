---
title: TEE Verifier
---

## [`settlementTeePallet`](https://github.com/zkVerify/zkVerify/tree/main/verifiers/tee)

### Statement hash components

- context: `keccak256(b"tee")`
- vk: `keccak256(vk.encode())`
- pubs: `keccak256(pubs)`

### `Verifier` implementation

This pallet implements a verifier for Trusted Execution Environment (TEE) attestation documents. It supports two backends, selected by the `Vk` variant submitted with the proof:

- **Intel**: Intel TDX / SGX DCAP attestation quotes, validated against an Intel TCB info response and a certificate chain.
- **Nitro**: AWS Nitro Enclaves attestation documents, which are self-contained (no off-chain TCB material is required).

The verification flow works as follows:
1. Resolves the CA name to use for the CRL lookup from the `Vk` variant (via the `CaNameProvider` trait).
2. Retrieves the Certificate Revocation List for that CA from `pallet-crl`. The CA must be registered, even if its CRL is empty, so that unpermissioned CRL updates remain possible.
3. Dispatches verification on the `Vk` variant:
   - **Intel**: parses the attestation quote from the proof bytes, parses the TCB info response from the verification key, checks TCB validity at the current timestamp, and verifies the quote against the TCB info and CRL.
   - **Nitro**: parses the attestation document from the proof bytes and verifies it against the CRL at the current timestamp.

- `verify_proof()` parses and validates the attestation against the data in the verification key (Intel) or against the self-contained attestation document (Nitro), in both cases consulting the CRL for the resolved CA.
- `validate_vk()` deserializes the TCB response JSON and verifies its signature using the provided certificates against the CRL. Nitro VKs carry no data and cannot be registered: `validate_vk()` returns `InvalidVerificationKey` for `Vk::Nitro`, so Nitro proofs must be submitted without a pre-registered VK.
- Define the following types:

  ```rust
  pub type Proof = Vec<u8>;  // TEE attestation, max 65536 bytes
  pub type Pubs = Vec<u8>;   // Max 0 bytes, not used
  pub enum Vk {
      Intel {
          tcb_response: Vec<u8>,   // TCB info JSON response, max 65536 bytes
          certificates: Vec<u8>,   // PEM-encoded certificate chain for TCB signature verification, max 65536 bytes
      },
      Nitro,
  }
  ```

- hash context data is `b"tee"`
- public inputs are not used (`MAX_PUBS_LENGTH = 0`)

#### Encoding

- For `Vk::Intel`, the `tcb_response` field should contain the JSON response body as returned by the [Intel Trusted Services TCB Info API](https://api.portal.trustedservices.intel.com/content/documentation.html), and `certificates` is a PEM-encoded chain (as provided by the `TCB-Info-Issuer-Chain` header of the response).
- For `Vk::Nitro`, the proof bytes are an AWS Nitro Enclaves attestation document (CBOR/COSE), which embeds its own certificate chain.

#### CRL Integration

The TEE verifier depends on `pallet-crl`, which manages Certificate Revocation Lists on-chain. The CRL pallet provides certificate revocation data via the `CrlProvider` trait, enabling the TEE verifier to check that certificates in the attestation chain have not been revoked.

Each `Vk` variant resolves to its own CA registered with `pallet-crl`. In the zkVerify runtime:

- `Vk::Intel { .. }` → CA `"Intel_SGX_Processor"`
- `Vk::Nitro` → CA `"AWS_Nitro"`

Both CAs must be registered with `pallet-crl` for the corresponding proofs to verify (an empty CRL is acceptable). CRL updates can be submitted in either PEM or DER form, via the `CrlInput::Pem { crl, cert_chain }` and `CrlInput::Der { crl, cert_chain }` variants respectively.
