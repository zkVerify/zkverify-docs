---
title: 概念
---
### Domains

Domain 是聚合 statement 的逻辑容器，每个域具备：

- 拥有者：可管理/注销域
- 可配置聚合大小（一次可聚合的验证结果数）与队列大小（发布前可存储的聚合数）
- 安全规则：控制谁可聚合
- 可选的跨链派发参数

### Domain States

域状态：

- `Ready`：可接收新 statement
- `Hold`：不可接收新 statement，但可发布现有聚合
- `Removable`：可注销（无待处理聚合）
- `Removed`：已移除

### Aggregation Security Rules

控制谁可触发聚合：

- `Untrusted`：任意账户可 aggregate
- `OnlyOwner`：仅域主/管理者可 aggregate
- `OnlyOwnerUncompleted`：已完成集合任何人可聚合，未完成仅域主/管理者可聚合

### Submitting Security Rules

谁可提交证明：

- `Untrusted`：任何人
- `OnlyOwner`：仅域主
- `OnlyAllowlisted`：仅白名单账户

## Actors

### Manager

可在任意域执行 Aggregate pallet 任何 extrinsic 的账户，无限制且免手续费。角色由 runtime 的 ManagerOrigin 配置决定。

### Domain Owner

可在特定域执行 Aggregate pallet 任何 extrinsic 的账户。调用 register_domain 的账户即为域主。

### Aggregator

调用 aggregate() 的角色。聚合通常无许可且有奖励：

- 调用者返还执行 extrinsic 的成本
- 另有可配置的 tip（未来可按域配置）

提交证明的用户按聚合大小平均分担上述成本。

### Delivery Owner

负责按域指定的派发机制，管理并执行聚合跨链所需链上操作的账户。主要职责包括设置合适的派发价格，以便中继等执行派发；可能需监控目标链费用、计算汇率、与中继方沟通等。

派发成本按聚合大小由所有提交者平摊。派发者可设置高于实际的价格以获得收益，作为其职责的报酬。
