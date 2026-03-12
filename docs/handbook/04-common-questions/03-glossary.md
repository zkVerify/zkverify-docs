---
title: "Glossary"
sidebar_position: 4
---
This page is a quick reference for terms that show up repeatedly in zkVerify integrations. The point is not to give full theory, but to connect each term to the stage where it matters and the kind of mistake it usually causes.

---

## Aggregation engine

**What it is (engineering intuition)**: packages a batch of verified proofs into a receipt (Merkle root) that a contract can verify.

**Why it appears**: on-chain contracts do not verify proofs one by one; they need a “batch receipt.”

**If you ignore it**: verification passes but there is no receipt, so contracts cannot consume the result.

---

## Commitment

**What it is (engineering intuition)**: commit to a value first, then open it later. The commitment is public, the original value is private.

**Why it appears**: you need to bind a fact without revealing privacy.

**If you ignore it**: you either leak privacy or verification cannot align.

---

## Poseidon

**What it is (engineering intuition)**: a circuit-friendly hash function with low cost, suitable for heavy hashing inside circuits.

**Why it appears**: standard hashes are expensive in circuits, making proofs slow or large.

**If you ignore it**: circuit constraints explode and proving time becomes unmanageable.

---

## Witness

**What it is (engineering intuition)**: the collection of private inputs and intermediate values used to generate a proof.

**Why it appears**: proofs are not generated from nothing; they require concrete input material.

**If you ignore it**: witness leakage breaks privacy; incorrect witness construction causes proof verification to fail.

---

## pk / vk / SRS

**What they are (engineering intuition)**:
- pk: keys or parameters needed to generate proofs.
- vk: public parameters used to verify proofs.
- SRS: the trusted setup public reference string for some systems.

**Why they appear**: without these artifacts, proofs cannot be generated or verified.

**If you ignore it**: vk/proof mismatch is the most common cause of verification failure.

---

## Domain

**What it is (engineering intuition)**: the “inbox” that a proof enters to reach the aggregation queue.

**Why it appears**: you need to route proofs by target chain or strategy to keep aggregation controllable.

**If you ignore it**: verification passes but aggregation fails, and the result cannot be consumed on-chain.

---

## How to use this page

When you see an unfamiliar term during submission, verification, aggregation, or consumption, use this page to locate where it belongs in the flow. When debugging, that is usually more useful than tweaking parameters first.
