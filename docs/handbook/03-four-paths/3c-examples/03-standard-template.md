---
title: "Standard Template for Every Example"
sidebar_position: 4
---
This page defines the format used by the examples in this handbook. The purpose is simple: every example should make the use case, input split, aggregation requirement, and consumption target obvious at a glance.

Each example should answer four questions:

1) What does this example prove, and what scenario does it solve?
2) Which inputs are public, and which must be private?
3) Do you need a domain (do you aggregate)?
4) Where is the result consumed (Web2 or contract)?

Below is the standard template. Each section should map to a concrete engineering decision.

---

## Example template (required)

**Use case / threat model**

- What am I proving?
- What risk am I preventing? (reuse, replay, privilege escalation, fake identity)

**Public vs private inputs**

- Public inputs:
- Private inputs:
- Why must they be split this way?

**Domain requirement**

- Do I need a domain?
- If yes, why do I need aggregation?
- If no, why is verify-only enough?

**Consumption target**

- Is the result consumed in Web2 or by a contract?
- If consumed by a contract, what form does it need?

---

## Example: filling the template once (real snippets)

Below is a membership-verification example showing the template filled once from end to end. The point is to make the structure explicit.

**Use case / threat model**

- Prove “I am on the list” without revealing the list.
- Prevent non-members from forging proofs.

**Public vs private inputs**

- Public inputs: `root` (the list’s Merkle root)
- Private inputs: `leaf`, `pathElements[]`, `pathIndices[]`
- Split reason: the root must be public for verification; the path and leaf must remain private to protect identity.

**Domain requirement**

- Domain required (if the result is consumed by an on-chain contract).
- Domain not required (if consumed only on the Web2 side).

**Consumption target**

- Web2: listen for the verification event and allow access.
- Contract: requires receipt + Merkle path.

---

## Minimal real submission code

**Kurier / REST path**

```ts
const params = {
  proofType: "ultrahonk",
  vkRegistered: true,
  chainId: 11155111,
  proofData: {
    proof: proof.proof,
    publicSignals: proof.pub_inputs,
    vk: vk.vkHash || vk.meta.vkHash
  }
}
await axios.post(`${API_URL}/submit-proof/${process.env.API_KEY}`, params)
```

**Polkadot.js / mainchain path**

```text
submitProof({
  vkOrHash: Vk,
  proof,
  pubs,
  domainId
})
```

The point of these two snippets is not “you must write it this way,” but to show how the template’s “input split” lands in structure: proof, vk, public inputs, and domainId must appear at the submission layer, or you cannot verify later.

---

## Why the template must be followed strictly

You will repeatedly encounter these situations in real projects:

- The example runs, but nobody knows what it proves.
- The example looks reasonable, but public/private split is wrong, and privacy is leaked.
- The example runs but produces no usable result because the consumer is misaligned.

This is not a “writing quality problem,” but **an engineering design distortion**. The template exists so readers can turn an example into their own engineering component, not just copy-paste.

> 💡 Tip: Before writing the example, fill in all four template sections. If you cannot fill them, do not write code.

> ⚠️ Warning: Do not treat the domain as a “decorative field.” It decides whether you aggregate and whether you can consume on-chain.

Final reminder: this template is not for formatting consistency, but for consistent engineering semantics. As long as each example clearly explains “proof statement, input split, aggregation requirement, consumer,” it can be reused in real projects.
