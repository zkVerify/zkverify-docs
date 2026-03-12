---
title: "Artifact Overview Table"
sidebar_position: 4
---

This page is about artifact boundaries: which files stay on the prover side, which move to the verifier, and which ones are sensitive enough that they should never leave their original context. Many verification failures are not chain issues at all. They come from artifact mismatches, such as a proof from one compile output paired with a vk from another.

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

Treat this table as a handoff checklist. Verify artifact flow first, then investigate chain-side behavior. The next section ties these artifacts back to setup differences so you can see why some of them change more often than others.
