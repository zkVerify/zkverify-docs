---
title: "2.1 The Three Roles (Explicit and Fixed)"
sidebar_position: 2
---

These three roles are not an org chart—they are three inevitable responsibility links in any ZK system. If you build ZK proofs, you will meet them even if one team covers all of them. Once roles are clear, debugging becomes much faster.

First, list the roles clearly:

- **Producer**: defines the circuit/program and produces usable vk
- **Prover**: takes private inputs and generates the proof
- **Verifier**: checks whether the proof is valid

Producer writes the circuit/program and defines vk. Think of it as “the party that sets acceptance standards,” because all later verification depends on it. In practice Producer might be you or a third‑party circuit author, but the role always exists.

Prover takes private inputs and generates the proof. Proving usually happens client-side because private inputs should not go on-chain. Engineering-wise, proof generation is off-chain and has noticeable compute cost.

Verifier takes the proof and public materials to decide validity. zkVerify plays this role, but it is not the only possible Verifier. Any system step that checks “is this proof valid?” is a Verifier.

A useful analogy is a QC line: Producer defines specs, Prover manufactures the sample, Verifier inspects and approves. If the inspection rules are wrong, “pass” is meaningless.

If you prefer to map roles to actions, use this simplified checklist:

1) Choose circuit and generate vk → Producer responsibilities
2) Prepare private inputs and produce proof → Prover responsibilities
3) Verify proof validity → Verifier responsibilities

You can also use a quick Q&A:

Q: Am I defining verification standards or generating proofs?
A: Standards are Producer; proof generation is Prover.

Q: Am I producing a proof or judging a proof?
A: Producing is Prover; judging is Verifier.

> ⚠️ Warning: If you treat Producer as Prover, the usual outcome is vk and proof coming from different circuit versions. Verification will always fail and you’ll misdiagnose it as a chain issue.

The point of this section is to separate responsibility boundaries. The next section breaks the five-step pipeline so you can map each role to concrete inputs and outputs.
