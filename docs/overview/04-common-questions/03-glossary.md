---
title: "Glossary"
sidebar_position: 4
---
This page is an “engineering quick reference.” It does not cover full theory; it covers terms you encounter most often in practice: what they are, why they appear in your flow, and what happens if you ignore them. After reading, you should place each term back into the system flow, not just memorize the literal meaning.

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

## Usage guidance

If this is your first integration with zkVerify, this page helps you place “terms” back into “flow.” Do not stop at definitions; see whether each term appears at submission, verification, aggregation, or consumption.

If you are debugging, start here for anchors: **which step does this term correspond to, and did I miss that step?** This is more effective than blindly changing parameters.
