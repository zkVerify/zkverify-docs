---
title: Introduction
---

## zkVerify and its verifiers

One of the key features of zkVerify is the set of verifiers living in it.

Expanding the set of verifiers is very important - the more verifiers present in zkVerify, the more proof types it can support. With more verifiers, there are more applications that can interact with the ecosystem.

As of now, the zkVerify developers have already included several verifiers (e.g. FFlonk, zkSync, Risc0, Groth16 and more) making the submission and verification of proofs for those proving systems a reality. However, it's important to enable external contributors to integrate new verifiers on their own. This is the purpose of this tutorial.

Following this guide you'll be able to integrate your verifier into zkVerify so that when the runtime is upgraded with the new verifier, everyone will be able to submit and verify proofs for its proving system.
