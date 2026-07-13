# 技术洞察方向发掘 — 2026-07-13

数据范围：最近 7 天 | 论文 200 篇 | 新闻 100 条 | 候选 255 条

---

## 🟡 Wi-Fi 7/8多链路异构网络的多智能体演进式吞吐量优化

**优先级:** 3/5 | **置信度:** medium

Wi-Fi 7/8引入多链路操作（MLO），但实际部署中MLO终端与传统单链路终端长期共存，吞吐量优化面临异构竞争挑战。EvoOMG提出演进式多智能体引导框架，针对legacy-MLO混合WLAN场景，通过多智能体协同优化信道接入与链路选择策略，解决异构终端共存下的公平性与总吞吐量平衡问题。

- **网络对象:** Wi-Fi 7/8 WLAN、多链路操作（MLO）、异构终端接入
- **AI 方法:** 多智能体演进式引导框架、协同优化
- **欧洲连接:** 无直接连接
- **华为关联:** 华为为主要Wi-Fi设备供应商，Wi-Fi 7/8企业网络为重要产品线；多智能体优化与自动驾驶网络理念一致

**支撑证据:**
- [EvoOMG: An Evolution-Oriented Multi-Agent Guidance Framework for Heterogeneous Legacy-and-MLO Wi-Fi Networks](http://arxiv.org/abs/2607.07045v1)

---

## 🟡 数字孪生增强联邦强化学习的车联网抗投毒安全防护

**优先级:** 3/5 | **置信度:** medium

联邦强化学习（FRL）在车联网多智能体协作决策中保护数据隐私，但面临投毒攻击威胁。本文提出Twin-Aware方案，利用数字孪生构建参考环境检测异常策略更新，在不共享原始数据前提下识别并隔离恶意参与者。实验量化了不同投毒比例下的决策鲁棒性，给出孪生校验的计算开销与检测精度权衡。

- **网络对象:** V2X车联网、车辆间通信协作决策面
- **AI 方法:** 联邦强化学习（FRL）、数字孪生驱动的投毒检测
- **欧洲连接:** BT（英国电信）关联
- **华为关联:** 直接对应网络数字孪生和自动驾驶网络方向；联邦学习安全性为华为隐私计算重点

**支撑证据:**
- [Securing Autonomous Vehicle Systems via Twin-Aware Federated Reinforcement Learning](http://arxiv.org/abs/2607.08137v1)

---

## 🔴 UAV辅助6G网络中AI服务质量双维度感知资源调配

**优先级:** 2/5 | **置信度:** medium

6G网络承载AI服务时需同时保障传统QoS（时延）与AI服务质量（QoAIS：输出保真度、连续性、个性化）。本文面向UAV辅助6G场景，提出双维度质量联合优化框架，在UAV覆盖受限、用户移动性高的条件下，实现AI推理任务的动态资源调配与服务连续性保障，量化了QoAIS各指标与传统质量之间的权衡关系。

- **网络对象:** UAV辅助6G网络、空地协同资源调度
- **AI 方法:** AI服务质量（QoAIS）建模、个性化资源优化
- **欧洲连接:** 无直接连接
- **华为关联:** QoAIS概念与华为NCE服务保障、自动驾驶网络SLA管理直接相关；6G+UAV为华为前沿研究方向

**支撑证据:**
- [Quality-Aware Personalized AI Service Provisioning in UAV-Assisted 6G Networks](http://arxiv.org/abs/2607.06278v1)

---

## 🔴 德国电信参与的欧洲主权混合稀疏架构基础大模型

**优先级:** 2/5 | **置信度:** medium

Soofi S 30B-A3B是面向德语和英语的主权开源基础大模型，采用MoE混合Mamba-Transformer架构，30B参数中每token仅激活3B，推理缓存近常量增长。Deutsche Telekom参与支持，体现欧洲电信运营商在AI基座层的主权布局。该混合架构在保持长上下文能力的同时大幅降低推理成本，对端侧和网络侧部署有参考价值。

- **网络对象:** 电信运营商AI基础设施、端网协同推理
- **AI 方法:** MoE混合Mamba-Transformer、稀疏激活推理优化
- **欧洲连接:** Deutsche Telekom（德国电信）参与支持、德国/欧洲AI主权战略
- **华为关联:** 与网络大模型方向直接相关；MoE稀疏架构对网络侧大模型部署有参考价值；欧洲运营商合作伙伴动向

**支撑证据:**
- [A Sovereign, Open-Source Foundation Model for German and English](http://arxiv.org/abs/2607.09424v1)

---

## 剔除方向

- Paper 3/7/10/16/30: 与2026-07-10至07-13已推荐方向的同批论文，无新增证据
- Paper 1 (PHaul IAB+PPO): 与已推荐'RAN轻量化RL部署范式'高度重叠，同覆盖IAB回传+PPO
- Paper 2 (Memory Injection): 个人AI助手安全，非电信网络
- Paper 4 (Cloud Compliance Mapping): 云安全合规映射，非网络AI
- Paper 5/15 (Agent Self-Evolution): 纯通用AI Agent演进，无网络机制
- Paper 8/17 (LLM推理调度/批处理): 偏计算调度侧，缺乏明确网络对象
- Paper 9 (Enterprise LLM Harness): 企业LLM工程化，非网络AI
- Paper 13/27/29 (SE Agent/Teaching/EvalLoop): 软件工程/通用AI评估，非网络领域
- Paper 14 (ResonatorLM): 纯LM架构创新，无网络关联
- Paper 18 (STEEL NPU): 端侧NPU推理优化，非网络AI
- Paper 19 (IoT Security Control): IoT安全闭环，网络AI交叉度不足
- Paper 20 (Blockchain Telecom Fraud): AI成分弱，主要贡献在区块链审计
- Paper 21/24/28 (NN Verification/Persona/LLM Eval): 纯AI方法论，网络关键词为误标注
- Paper 22/23/26 (Agentic AI Security/Severity/CRA): 通用AI安全与欧洲法规分析，非网络技术

## 候选数据摘要（Top 15）

| # | 类型 | 标题 | Network AI | 分数 |
|---|------|------|-----------|------|
| paper | arXiv | PHaul: A PPO-based forwarding agent for Sub6 en... | ✅ | 13 |
| paper | arXiv | When Claws Remember but Do Not Tell: Stealthy M... | ✅ | 13 |
| paper | arXiv | Spatio-Temporal Scheduling Prediction Under Bac... | ✅ | 13 |
| paper | arXiv | Automated Compliance Mapping in Cloud Security ... | ✅ | 13 |
| paper | arXiv | EvoAgentBench: Benchmarking Agent Self-Evolutio... | ✅ | 13 |
| paper | arXiv | Securing Autonomous Vehicle Systems via Twin-Aw... | ✅ | 13 |
| paper | arXiv | Privacy-Preserving Intent Fulfilment and Assura... | ✅ | 12 |
| paper | arXiv | SMetric: Rethink LLM Scheduling for Serving Age... | ✅ | 12 |
| paper | arXiv | From Prompts to Contracts: Harness Engineering ... | ✅ | 12 |
| paper | arXiv | ORAN-DEFEND: Subspace Detection and Sanitizatio... | ✅ | 12 |
| paper | arXiv | EvoOMG: An Evolution-Oriented Multi-Agent Guida... | ✅ | 12 |
| paper | arXiv | Quality-Aware Personalized AI Service Provision... | ✅ | 12 |
| paper | arXiv | Reliable and Developer-Aligned Evaluation of Ag... | ✅ | 12 |
| paper | arXiv | ResonatorLM: Causal Resonant Field Mixing for E... | ✅ | 12 |
| paper | arXiv | MetaSkill-Evolve: Recursive Self-Improvement of... | ✅ | 12 |
