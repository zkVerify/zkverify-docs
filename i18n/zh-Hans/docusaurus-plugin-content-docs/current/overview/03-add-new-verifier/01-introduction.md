---
title: 介绍
---

## zkVerify 与其 verifiers

zkVerify 的核心特性之一就是内置的一组 verifier。

扩充 verifier 十分关键——verifier 越多，zkVerify 能支持的证明类型越多，可与生态互动的应用也越丰富。

目前 zkVerify 已内置多种 verifier（如 FFlonk、zkSync、Risc0、Groth16 等），可直接提交并验证对应证明。但我们同样希望让外部贡献者能自行集成新 verifier，这正是本教程的目的。

按照本指南，你可以将自定义 verifier 集成进 zkVerify，待 runtime 升级后，所有人即可提交并验证对应证明。
