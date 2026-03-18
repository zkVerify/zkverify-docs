---
title: TEE Verifier
---

## [`settlementTeePallet`](https://github.com/zkVerify/zkVerify/tree/main/verifiers/tee)

### Statement hash 组成

- context: `keccak256(b"tee")`
- vk: `keccak256(vk.encode())`
- pubs: `keccak256(pubs)`

### `Verifier` 实现

该 pallet 为 Trusted Execution Environment (TEE) attestation quote 提供 verifier，当前针对 Intel TDX (Trust Domain Extensions)。它用于验证给定 attestation quote 的真实性，并确认其确实由真实的 TEE 生成。

验证流程如下：
1. 从 proof 字节中解析 TEE attestation quote
2. 从 verification key 中解析 TCB (Trusted Computing Base) info response
3. 检查当前时间下 TCB 是否有效
4. 通过 `pallet-crl` 获取 Certificate Revocation List (CRL)，这里通过 `CrlProvider` trait 使用 CA 名称 `"Intel_SGX_Processor"`
5. 基于 TCB info 和 CRL 校验 attestation quote

- `verify_proof()` 会解析 attestation quote，并基于 verification key 中提供的 TCB info 与证书链完成校验。
- `validate_vk()` 会反序列化 TCB response JSON，并使用提供的证书对 TCB response signature 做校验，同时检查对应 CRL。
- 类型定义如下：

  ```rust
  pub type Proof = Vec<u8>;  // TEE attestation quote, max 8192 bytes
  pub type Pubs = Vec<u8>;   // Max 0 bytes — not used
  pub struct Vk {
      pub tcb_response: Vec<u8>,   // TCB info JSON response, max 8192 bytes
      pub certificates: Vec<u8>,   // PEM-encoded certificate chain for TCB signature verification, max 8192 bytes
  }
  ```

- hash context data 为 `b"tee"`
- public inputs 不使用（`MAX_PUBS_LENGTH = 0`）

#### 编码

- `tcb_response` 字段应包含 [Intel Trusted Services TCB Info API](https://api.portal.trustedservices.intel.com/content/documentation.html) 返回的 JSON response body。
- 所有证书与证书链都应使用 PEM 编码。

#### CRL 集成

TEE verifier 依赖 `pallet-crl` 来管理链上的 Certificate Revocation Lists。CRL pallet 通过 `CrlProvider` trait 提供证书吊销数据，使 TEE verifier 能够检查 attestation chain 中的证书是否已被吊销。
