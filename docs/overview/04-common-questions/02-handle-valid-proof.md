---
title: "Handle Valid Proof"
sidebar_position: 3
---
This page answers a direct engineering question: **after a proof is verified, what should you do?** You can consume results on the Web2 side or on the contract side. The difference is not “whether verification succeeded,” but “where you record the result and who trusts it.”

Start with Web2 consumption. After you get the verification result, common actions are authorization, issuance, and audit logging. You do not need a receipt; you only need a stable “verification fingerprint,” typically the statement or a traceable ID. Writing it to your database gives you idempotency control and audit traceability.

```ts
type VerificationRecord = {
  statement: string
  userId: string
  action: string
  status: "verified"
  createdAt: string
}
```

The most overlooked issue on the Web2 side is “repeat consumption.” If you do not store the statement, every call looks like a new verification, causing duplicate issuance or authorization. The fix is simple: use statement as a unique index; check first, then write.

```ts
if (db.verifications.has(statement)) {
  return "already processed"
}
db.verifications.insert({ statement, status: "verified" })
```

Now contract consumption. Contracts do not verify proofs; they verify receipt + Merkle path. You need to go through aggregation, obtain the receipt, then pass the leaf and path for contract verification. The contract entry point is usually `verifyProofAggregation`.

```solidity
function verifyProofAggregation(
    uint256 _domainId,
    uint256 _aggregationId,
    bytes32 _leaf,
    bytes32[] calldata _merklePath,
    uint256 _leafCount,
    uint256 _index
) external view returns (bool);
```

Only after contract verification should you execute “issuance/authorization/state changes.” If you execute business logic before the receipt is published, you are trusting yourself rather than zkVerify’s verification result.

```text
if verifyProofAggregation(...):
  executeBusinessAction()
```

The core difference can be explained with an analogy: Web2 consumption is like “internal approval,” while contract consumption is like “external notarization.” Internal approval only needs your own records; external notarization requires a certificate (receipt).

**Security considerations:**

- **Replay**: proofs or statements reused.
- **Double-claim**: the same credential consumed multiple times.
- **Data leakage**: private inputs incorrectly exposed.

On the Web2 side, the fix is “persistence + idempotency control.” On the contract side, the fix is “receipt + Merkle path + nullifier or unique index.”

> ⚠️ Warning: Verification success does not equal business completion. You still need idempotency and risk control at the consumption layer, or you will issue or authorize twice.

> 💡 Tip: If you are unsure where to consume, start with Web2 consumption to validate the logic, then migrate to contract consumption. This lets you debug the verification path and business logic separately.

This page aims to turn “verification success” into “business action.” The next page is the Glossary to map common terms back to system behavior.
