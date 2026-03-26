---
title: "Setup 差异"
sidebar_position: 5
---

当你切换证明系统时，真正要重新判断的不是语法，而是 setup 模式。setup 会决定 vk 能不能复用、是否需要可信仪式，以及你的系统要保存哪些产物。所以这页把 Groth16、Noir 和 zkVM 分开来看。

下面这张对比表是工程视角的最小清单：你要记住的是“需要什么、能复用什么、哪里容易出错”。

| 证明系统 | Setup 模式 | 可复用性 | 常见工程后果 |
| --- | --- | --- | --- |
| Groth16 | per-circuit setup | 低 | 换电路就得重新生成 vk |
| UltraPlonk / UltraHonk (Noir) | universal SRS + circuit-specific vk | 中 | SRS 可复用，但 vk 仍随电路变 |
| zkVM (Risc0 / SP1) | transparent (no trusted setup) | 高 | 少了 setup 步骤，但 proof 更大、验证成本可能更高 |

> 📌 注意：这里的“可复用性”指 vk 和 setup 产物是否能跨电路复用，不是指 proof 本身。

你在实际工程里会遇到两个决策点：

1) 你愿不愿意接受可信 setup 的成本？如果不愿意，zkVM 的透明 setup 更合适。
2) 你更在乎 proof 尺寸还是生成/验证成本？Groth16 往往更小但更依赖 setup，zkVM 更通用但 proof 往往更大。

如果你现在还不确定选哪一个，先对照你现有的电路和部署目标：是否频繁改电路、是否需要复用 vk、是否能接受 setup。后面章节会结合具体 proof 系统再细拆。
