---
title: "Quickstart"
sidebar_position: 1
---

Quickstart takes you from prepared proof artifacts to a verified result with the least amount of setup. The point is to confirm that your proof, vk, public inputs, and submission parameters line up before you add domain, aggregation, or contract-side consumption.

You can start with either Kurier or zkVerifyJS. Kurier is the REST API route: get an API key, call `register-vk`, then `submit-proof`. zkVerifyJS talks to the chain directly: configure a seed phrase and start a Volta session to submit verification. In both paths, you still need the same core artifacts: proof, vk, and public inputs.

The endpoint of verify-only is the `ProofVerified` event. You don’t need to publish results to a destination chain; you just consume them in your application. The most common pattern is to treat the statement as a “verified marker” and move into authorization, settlement, or audit flows.

Kurier also provides job-status polling. For the verification path, you typically watch `Submitted` → `IncludedInBlock` → `Finalized` to know when the result is stable. If you are on an aggregation path, you may later also see `AggregationPending` → `Aggregated`. zkVerifyJS is more on-chain: your account needs tVFY for transaction fees to complete a verification request.

If you eventually need on-chain consumption, the later sections add aggregation and receipt publication. For now, the useful milestone is much smaller: submit once, get a stable verification result, and confirm the artifacts you are producing are actually usable.
