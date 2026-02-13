---
title: "Artifact Overview Table"
sidebar_position: 4
---

This page answers one question: when you’re debugging or designing access boundaries, which artifacts should stay local and which can be handed to the verifier? Many failures are not “chain issues,” but artifact misalignment — for example, proof from one compile output and vk from another, or public inputs that don’t match that proof, so the statement doesn’t line up.

Use the “warehouse + receipt” analogy: secret / witness are raw materials in the warehouse and shouldn’t leave; proof / public inputs are like inspection receipts that must go to the verifier. This is not for style — it prevents you from pushing private materials into the wrong system during architecture splits.

You’ll use this table most often in two situations: storage design during integration, and debugging after verification failures. The first requires knowing “what can be cached vs what must stay client-side”; the second requires knowing “which stage to trace back.”

The table below is the full checklist. It’s not a flowchart — it’s a handoff sheet. Use it to verify who owns each artifact, where it flows, and whether it’s sensitive.

| Artifact | Who generates it | Who consumes it | Sensitive? |
| --- | --- | --- | --- |
| secret | Prover | Prover | Yes |
| witness | Prover | Prover | Yes |
| proof | Prover | Verifier | No |
| public inputs | Prover | Verifier | No |
| pk | Setup / Prover | Prover | Yes |
| vk | Setup / Prover | Verifier | No |
| SRS | Setup ceremony | Prover / Verifier | No |

If you’re stuck debugging, first check vk, proof, and public inputs as a single “version alignment” set. The verifier doesn’t look at proof in isolation; it binds vk, proof version info, and public inputs into a statement hash. If any element comes from a different version, the statement changes and verification fails.

```text
statement = keccak256(
  keccak256(verifier_ctx),
  hash(vk),
  version_hash(proof),
  keccak256(public_inputs_bytes)
)
```

For access-boundary design, this table becomes a storage policy: secret / witness stay on the Prover side; proof / public inputs can enter the verification layer; vk can be reused but must be versioned strictly. You don’t need to put everything in one database — split by sensitivity.

> ⚠️ Warning: Once secret or witness leaves the Prover side, the privacy assumption is broken. Verification may still pass, but the system is no longer secure.

> 💡 Tip: If verification fails intermittently, check first whether vk and proof come from the same compile outputs. This is more common than on-chain logic issues.

Treat this table as an engineering checklist: verify artifact flow first, then investigate chain issues. The next section ties these artifacts back to roles and process so you can locate responsibility boundaries faster.
