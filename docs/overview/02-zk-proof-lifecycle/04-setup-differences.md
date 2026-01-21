---
title: "2.4 Setup Differences (Explicit Comparison)"
sidebar_position: 5
---

When you switch proof systems, the most common pitfall is not “syntax differences,” but completely different setup models. Setup determines whether vk can be reused, whether a trusted ceremony is required, and which artifacts you must store. That’s why this page separates Groth16, Noir, and zkVM.

Think of setup as “factory calibration.” Some systems recalibrate each production line (per-circuit), some use a shared calibration (universal SRS), and some require no calibration at all (transparent). If you mix these models, the usual failure is either vk reuse breaks or you assume setup is unnecessary and miss required artifacts.

The table below is the minimum engineering checklist: what you need, what can be reused, and where it commonly breaks.

| Proof system | Setup model | Reusability | Common engineering outcome |
| --- | --- | --- | --- |
| Groth16 | per-circuit setup | low | Changing circuits requires regenerating vk |
| UltraPlonk / UltraHonk (Noir) | universal SRS + circuit-specific vk | medium | SRS is reusable, but vk still changes per circuit |
| zkVM (Risc0 / SP1) | transparent (no trusted setup) | high | No setup step, but proofs tend to be larger and verification may cost more |

> 📌 Note: “Reusability” here refers to vk and setup artifacts across circuits, not proofs themselves.

In practice you’ll face two decision points:

1) Are you willing to accept trusted setup costs? If not, transparent zkVMs are a better fit.
2) Do you care more about proof size or proving/verification cost? Groth16 is usually smaller but setup-heavy; zkVMs are more general but tend to produce larger proofs.

If you’re unsure, align with your current circuit and deployment goals: how often circuits change, whether vk reuse matters, and whether you can accept setup. Later sections break this down by proof system in more detail.
