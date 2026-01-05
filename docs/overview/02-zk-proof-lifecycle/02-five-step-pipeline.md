---
title: "2.2 The Five-Step Pipeline (With Inputs and Outputs)"
sidebar_position: 3
---

This section explains the complete ZK proof lifecycle step by step:

- Step 1: Compile
  Generates r1cs/wasm or acir/artifacts.
- Step 2: Setup / SRS
  Which systems require setup and what artifacts are produced (pk / vk / SRS).
- Step 3: Witness
  Why witness data is sensitive and why it must stay on the user side.
- Step 4: Proof
  How the proof and publicSignals are produced.
- Step 5: Verify
  How vk + proof + publicSignals produce a true / false result.
