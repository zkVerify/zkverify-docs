---
title: 概览
---

## 纳入 Runtime

完成库的 “pallet 化” 后，你已得到可兼容 Substrate 节点的包，可集成到任意 Substrate 链。要让它在 zkVerify 可用，需要将其加入 zkVerify 的 runtime。

请注意，你正在生成新的 runtime，要部署到线上链（测试网或主网）需通过特定 extrinsic `system.setCode` 进行升级。在链升级前，用户只能在本地链用于开发测试，无法在任何线上链使用。
