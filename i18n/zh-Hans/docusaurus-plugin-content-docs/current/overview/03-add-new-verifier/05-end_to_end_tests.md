---
title: 端到端测试
---

## 分步指南

### 扩充端到端测试集

端到端（E2E）测试集是 zkVerify CI/CD 用于外部验证节点功能的工具，扩充以覆盖新 pallet 对稳定性与可靠性十分重要。

步骤如下：

- 新建 `zombienet-tests/js_scripts/foo_data.js`，按与 `verifiers/foo/src/resources.rs` 类似的方式定义测试数据：

  ```javascript
  const PROOF = "0x00...02"
  const PUBS = "0000000000000000000000000000000000000000000000000000000000000003"
  const VKEY = "0x0000000000000000000000000000000000000000000000000000000000000001"
  
  exports.PROOF = PROOF
  exports.PUBS = PUBS
  exports.VK = VKEY
  ```

- 修改 `zombienet-tests/js_scripts/0005-proofPath_rpc.js`，在其他 verifier 对应行之后添加：

  ```javascript
  const { PROOF: FOO_PROOF, PUBS: FOO_PUBS, VK: FOO_VK } = require('./foo_data.js');
  ```

  最后在同一文件追加：

  ```javascript
  ,
  {
      name: "Foo",
      pallet: api.tx.settlementFooPallet,
      args: [{ 'Vk': FOO_VK }, FOO_PROOF, FOO_PUBS],
  }
  ```

此时即可按 `zombienet-tests/README.md` 指引在本地运行端到端测试。
