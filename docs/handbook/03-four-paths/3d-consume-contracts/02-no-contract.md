---
title: "I Do Not Have a Contract"
sidebar_position: 3
---
This section is for scenarios where results are consumed only in Web2/system-side workflows. You do not need a receipt or an on-chain contract, only **reliable verification results and a way to land them in your business system**. It sounds simple, but engineering often hits three pitfalls: lost events, duplicate processing, and insufficient confirmation depth.

In the verify-only route, your core signal is a stable verification result. One common implementation is polling Kurier `job-status`: the status moves from `Submitted` → `IncludedInBlock` → `Finalized`. When it reaches `Finalized`, you can treat the result as stable.

```ts
const jobStatusResponse = await axios.get(
  `${API_URL}/job-status/${process.env.API_KEY}/${jobId}`
)
if (jobStatusResponse.data.status === "Finalized") {
  // consume verification result
}
```

Here is a practical note: current Kurier docs explicitly mark `AggregationPending` and `Aggregated` as chain-ID-dependent statuses. If your flow needs aggregation-level status updates, make sure `chainId` is provided. Do not assume every earlier verification status depends on the same rule.

Think of verify-only as “business-side acceptance.” You do not need on-chain receipt verification, but you must save a traceable verification record on the business side, or you will lose evidence during retries and audits. The simplest approach is to persist the statement with business context.

```ts
type VerificationRecord = {
  statement: string
  status: "verified"
  userId: string
  createdAt: string
}
```

The purpose of this record is not “logging,” but idempotent control. If the statement already exists, reject reprocessing to avoid duplicate authorization or duplicate issuance.

```ts
if (db.verifications.has(statement)) {
  return "already processed"
}
db.verifications.insert({ statement, status: "verified" })
```

If you need stronger reliability, make “confirmation depth” a business rule: for example, write records only on `Finalized` to avoid misjudgment due to chain reorgs. The engineering purpose is to separate the “on-chain unstable window” from the “business-side confirmation window.”

> 💡 Tip: Use `Finalized` as the default threshold; if you need faster feedback, then consider `IncludedInBlock`.

> ⚠️ Warning: Do not treat `Submitted` as verification success. It only means “submitted on-chain,” not “result is stable.”

The core here is “reliability of result consumption.” You do not need a receipt, but you must handle lost events, duplicate processing, and confirmation depth. Otherwise, your verification system looks like it runs, but your business ends up with random accounting errors.

The next section explains “when aggregation is mandatory,” helping you decide when to move from verify-only to the on-chain consumption path.
