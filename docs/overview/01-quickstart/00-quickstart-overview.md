---
title: "Quickstart"
sidebar_position: 1
---

The goal of Quickstart is simple: run a full loop once — submit a proof and get a verification result. We intentionally defer complex decisions, get the verification path working first, then introduce aggregation, domain, and on-chain consumption. The benefit is you quickly learn whether your proof and vk match and whether submission parameters are correct, instead of getting blocked by chain dependencies up front.

This chapter gives you the two shortest paths: Kurier and zkVerifyJS. Kurier is the REST API route: get an API key, call `register-vk`, then `submit-proof`. zkVerifyJS talks to the chain directly: configure a seed phrase and start a Volta session to submit verification. The common requirement is the same for both: prepare proof, vk, and public inputs, then wait for a verification result.

The endpoint of verify-only is the `ProofVerified` event. You don’t need to publish results to a destination chain; you just consume them in your application. The most common pattern is to treat the statement as a “verified marker” and move into authorization, settlement, or audit flows.

Kurier also provides job-status polling. States move from `Submitted` → `IncludedInBlock` → `Finalized`, which lets you know when verification is complete. zkVerifyJS is more on-chain: your account needs tVFY for transaction fees to complete a verification request.

If you eventually need on-chain consumption, later sections move into aggregation and receipt publication. That path adds more chain dependencies, so here the goal is to make verify-only stable first and confirm “proofs are verifiable.”
