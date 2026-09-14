# 技术洞察方向发掘 — 2026-09-14

数据范围：最近 14 天 | 论文 201 篇 | 新闻 100 条 | 候选 254 条

---

## 🔴 🔄 自进化提示注入与记忆阶段风险量化威胁自治网络智能体安全

**优先级:** 1/5 | **置信度:** high | **更新**

ECLIPSE提出面向长程智能体的自进化隐蔽提示注入攻击，可在多轮工具调用中逐步植入恶意目标；同期研究量化了LLM智能体记忆机制各阶段的效用-风险权衡，发现记忆保留量与投毒脆弱性正相关。结合Cisco/TM Forum AgenticOps产业推进，自治网络智能体面临注入+记忆双重攻击面，亟需系统性安全框架。

- **网络对象:** 自治网络智能体、电信运维Agent、RAN智能控制
- **AI 方法:** LLM Agent、长程任务规划、记忆机制、提示注入攻防
- **软件技术栈:** Agent框架、工具调用编排、记忆存储管理
- **欧洲连接:** TM Forum Moonshot Catalyst奖项（欧洲电信标准组织）、Horizon EU资助
- **华为关联:** iMaster NCE自动驾驶网络Agent安全边界、网络智能体可信执行、AgenticOps治理
- **🔄 更新原因:** 相比09-13记忆投毒方向新增：ECLIPSE引入自进化注入攻击（新攻击向量，非记忆层面）；Paper 26提供阶段性效用-风险量化框架（补充定量分析维度）

**支撑证据:**
- [ECLIPSE: Self-Evolving Stealthy Prompt Injection Attack against Long-Horizon Agentic Systems](https://arxiv.org/abs/2608.30441)
- [Understanding Stage-Wise Utility-Risk Trade-offs in LLM Agent Memory](https://arxiv.org/abs/2608.30177)
- [The Power of Co-Innovation for AgenticOps and Autonomous Networks](https://blogs.cisco.com/sp/the-power-of-co-innovation-for-agenticops-and-autonomous-networks)

---

## 🔴 🔄 近数据动态专家调度联合MoE缩放定律协同优化推理集群

**优先级:** 2/5 | **置信度:** high | **更新**

DynaNDE针对NPU集群MoE推理提出动态近数据专家调度算法，通过NPU-host协作降低数据搬移开销；SMELT在FLOP严格匹配条件下验证MoE循环Transformer缩放定律，揭示深度复用与专家稀疏的最优配比。两项工作分别从调度机制和架构选型为推理集群设计提供量化依据，可联合指导集群网络拓扑与计算编排。

- **网络对象:** AI推理集群互联网络、NPU-host数据通路、RoCE网络
- **AI 方法:** MoE稀疏推理、循环Transformer、缩放定律
- **软件技术栈:** NPU近数据处理调度器、推理服务框架、集群编排
- **欧洲连接:** 无直接连接
- **华为关联:** Atlas NPU推理集群调度优化、CloudEngine AI集群网络设计、大模型推理服务架构
- **🔄 更新原因:** DynaNDE(2609.00407)为新论文，提供NPU协作调度具体算法与量化结果；SMELT(2609.01343)为新论文，补充FLOP匹配条件下缩放定律实验数据

**支撑证据:**
- Paper 31: DynaNDE: Dynamic Near-Data Expert Scheduling for Batched MoE Inference
- Paper 32: SMELT: Scaling Laws for Compute-Matched MoE Looped Transformers

---

## 🟡 🔄 防泄漏基准评测与无梯度进化训练双轨推进SNN网络入侵检测

**优先级:** 3/5 | **置信度:** medium | **更新**

SNN入侵检测领域出现两项互补进展：一是构建防数据泄漏的严格评测基准，系统比较神经元模型与脉冲编码对检测性能的影响，揭示既有评测中预处理信息泄漏导致的虚高指标；二是提出低秩进化策略实现SNN无梯度训练，绕过脉冲不可微分问题，为端侧神经形态硬件部署扫清训练障碍。

- **网络对象:** 网络入侵检测系统(NIDS)、网络流量分析
- **AI 方法:** 脉冲神经网络(SNN)、进化策略、神经形态计算
- **软件技术栈:** 神经形态推理芯片部署链路、端侧检测引擎
- **欧洲连接:** EU资助研究
- **华为关联:** 网络安全AI检测、端侧低功耗推理、昇腾神经形态计算探索
- **🔄 更新原因:** Paper 12(v2更新)补充防泄漏基准方法论，修正既有评测虚高问题；Paper 24(v2更新)完善低秩进化策略实验

**支撑证据:**
- [The Value of Spike Timing: A Leakage-Resistant Benchmark of SNN Design Choices for Network Intrusion Detection](https://arxiv.org/abs/2606.01442)
- [Gradient-Free Training of Spiking Neural Networks via Low-Rank Evolution Strategies](https://arxiv.org/abs/2605.30361)

---

## ⚪ 强化学习求解器梯度引导MPC在线自适应启发网络控制闭环

**优先级:** 4/5 | **置信度:** medium

该研究提出将MPC求解器梯度反向传播至RL策略网络，实现控制权重的上下文自适应在线调整，避免传统RL在MPC参数空间的盲目搜索。该方法在连续控制任务中显著加速收敛并提升闭环性能。虽论文面向通用控制，但可微分MPC+RL框架对网络控制闭环（如流量工程权重自适应、RAN参数动态调优）具有直接技术迁移价值。

- **网络对象:** 网络控制闭环、流量工程、RAN参数优化
- **AI 方法:** 强化学习、模型预测控制(MPC)、可微分优化
- **欧洲连接:** Horizon EU框架资助
- **华为关联:** 自动驾驶网络控制闭环、iMaster NCE意图驱动策略优化、RAN智能控制参数自适应

**支撑证据:**
- [Accelerating Reinforcement Learning via MPC Solver-Gradient Guidance for Weights-varying MPC](https://arxiv.org/abs/2609.01061)

---

## 剔除方向

- Paper 3/4/8/9/10/11/19/20/22/25/29/30/33/34/46/49: 非通信网络（物理/数学/机器人/天文/能源等领域，RIC/RAN关键词为文本误匹配）
- Paper 13/14/36/50: 网络关联弱（无线人脸检测/浏览器WebAssembly/EEG解码/生物特征，非核心网络对象）
- Paper 15/16/23/38/39/40/41/42/43/45/47/48: 纯AI理论或纯应用安全，无明确网络系统机制（Paper 39 SONiC关键词为PDE求解器误匹配）
- Paper 21/27/35/44: 代码Agent/系统安全方向，非网络基础设施安全范畴
- Paper 1: ZK多Agent信任验证已连续两期推荐（09-09/09-10），本期同一论文无显著新实验数据
- Paper 37: 端云嵌入隐私传输已推荐（09-10），同一论文（2503.12896）无版本更新
- Paper 2: 递归状态编码NCO已推荐（09-12），同一论文无更新
- Paper 5: MoE视觉后门攻击中routing指专家路由而非通信网络路由，网络关联不足
- Paper 6: JIT推理服务故障注入已推荐（09-10），无新补充证据
- Paper 7: 三层路由Agent执行优化与09-13分层路由缓存方向高度重叠，无新实质证据

## 候选数据摘要（Top 15）

| # | 类型 | 标题 | Network AI | 分数 |
|---|------|------|-----------|------|
| paper | - | Zero-Knowledge Predicate Proofs Between AI Agen... | ✅ | 18 |
| paper | - | Recurrent State Encoders for Efficient Neural C... | ✅ | 16 |
| paper | - | Building the Truman Show: A TrustZone-Based Fra... | ✅ | 15 |
| paper | - | Sierpi\'nski--Knopp Wasserstein Distance for Pe... | ❌ | 13 |
| paper | - | BadPatches: Routing-Aware Backdoor Attacks on V... | ✅ | 13 |
| paper | - | JITterFlip: Uncovering Fault Attack Surfaces in... | ✅ | 13 |
| paper | - | TRIAGE: Three-level Routing and Intelligent Age... | ✅ | 12 |
| paper | - | Matched Queries for Curvature and Density at Br... | ❌ | 12 |
| paper | - | Facet-0: A Robotic Foundation Model for Contact... | ✅ | 12 |
| paper | - | Accelerating Chemical Kinetics for Exoplanet At... | ✅ | 12 |
| paper | - | The Value of Depth in Message Passing on Sparse... | ✅ | 12 |
| paper | - | The Value of Spike Timing: A Leakage-Resistant ... | ✅ | 12 |
| paper | - | UiAs: User-Independent 3D Facial Anti-Spoofing ... | ✅ | 12 |
| paper | - | The Web-CLI: Verifiable Privacy for Tools, Mode... | ✅ | 12 |
| paper | - | Efficient Learning of Balanced Signed Graphs vi... | ✅ | 11 |
