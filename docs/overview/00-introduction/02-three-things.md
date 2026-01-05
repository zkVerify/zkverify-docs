---
title: "0.2 The Three Things You Do When Building a zkVerify Project (Minimal Model)"
sidebar_position: 3
---

This section reduces a zkVerify project to three unavoidable actions, so developers immediately understand what they are responsible for:

- Choose a proof system (Groth16 / Noir / zkVM / EZKL …)
  This determines which zero-knowledge technology stack and tooling you will use.
- Prepare the verification context (vk / program id / domain)
  You prepare the information zkVerify needs to verify proofs, and define the context in which verification happens.
- Let users generate proofs, submit them to zkVerify, and consume the result in your application
  Users generate proofs locally, you submit the proofs to zkVerify, and then integrate the verification result into your business logic.
