# 技术洞察方向发掘 — 2026-08-23

数据范围：最近 14 天 | 论文 201 篇 | 新闻 100 条 | 候选 249 条

---

## 🔴 🔄 LLM Agent元认知提示注入与注意力劫持对网络运维Agent纵深防御

**优先级:** 2/5 | **置信度:** medium | **更新**

两篇新论文揭示LLM Agent攻击面持续扩展：一篇提出元认知反思驱动的单次间接提示注入，通过结果条件化策略抽象绕过多轮交互防线；另一篇提出注意力集中机制劫持计算机使用Agent偏好。两种攻击均针对工具调用Agent，直接威胁网络运维场景中集成外部数据源的AI Agent安全。攻击从视觉层深入至推理策略层，要求防御从输入过滤扩展至推理链路审计。

- **网络对象:** 网络运维AI Agent/工具调用Agent
- **AI 方法:** LLM Agent/间接提示注入/注意力机制攻击
- **欧洲连接:** 无直接连接
- **华为关联:** iMaster NCE智能运维Agent、自动驾驶网络AI决策链路安全防护
- **🔄 更新原因:** 相比8/19推荐新增两种攻击范式：元认知单次注入(Paper 25)和注意力集中偏好劫持(Paper 48)，攻击面从GUI视觉层扩展至Agent推理策略层

**支撑证据:**
- [Toward Metacognitive One-Shot Indirect Prompt Injection: Strategy Abstraction Via Outcome-Conditioned Reflection](https://arxiv.org/abs/2608.08795)
- Paper 48: Preference Redirection via Attention Concentration: An Attack on Computer Use Agents

---

## 🟡 概率神经网络不确定性安全滤波对网络自治闭环安全探索约束

**优先级:** 3/5 | **置信度:** medium

论文提出基于概率神经网络动力学模型的不确定性感知预测安全滤波器，在深度RL探索中通过模型预测控制强制约束满足。关键创新在于将NN动力学不确定性量化集成至安全滤波流程，使安全边界随模型置信度自适应调整。可映射至自动驾驶网络场景：RAN智能控制器在RL策略探索中需保障QoS底线，不确定性感知安全滤波可提供比硬约束更灵活且可扩展的安全保障机制。

- **网络对象:** RAN智能控制器/自动驾驶网络闭环
- **AI 方法:** 深度强化学习/概率神经网络/模型预测控制
- **欧洲连接:** 无直接连接
- **华为关联:** 自动驾驶网络(ADN)安全探索、iMaster NCE RL策略安全约束、RAN xApp安全决策边界

**支撑证据:**
- [Uncertainty-Aware Predictive Safety Filters for Probabilistic Neural Network Dynamics](https://arxiv.org/abs/2604.26836)

---

## 🔴 🔄 MoE弹性专家解耦与统计无损量化协同推进网络侧大模型部署

**优先级:** 2/5 | **置信度:** medium | **更新**

三篇论文从不同层面推进大模型高效部署：MoE-Prism(v2)提出模型-系统协同设计，将整体式专家解耦为可独立调度的弹性单元突破固定路由限制；统计无损量化框架在保持统计保真度前提下实现推理加速；KronQ引入Kronecker分解Hessian优化量化目标。三者可构成'弹性调度+无损压缩+精准量化'系统化部署流水线，适用于网络边缘侧资源受限场景AI模型服务。

- **网络对象:** 网络边缘侧AI推理服务/网络侧大模型部署
- **AI 方法:** MoE弹性调度/后训练量化/Kronecker Hessian优化
- **软件技术栈:** vLLM推理框架/模型部署pipeline
- **欧洲连接:** 无直接连接
- **华为关联:** CloudEngine网络设备侧AI推理、iMaster NCE大模型部署、网络边缘AI服务弹性调度
- **🔄 更新原因:** 整合8/20 MoE方向和8/22量化方向，新增系统协同视角：MoE-Prism v2更新 + 统计无损量化新框架(Paper 3)补充压缩保真度保障

**支撑证据:**
- [MoE-Prism: Disentangling Monolithic Experts for Elastic MoE Services via Model-System Co-Designs](https://arxiv.org/abs/2510.19366)
- [Statistically-Lossless Quantization of Large Language Models](https://arxiv.org/abs/2605.02404)
- Paper 50: KronQ: LLM Quantization via Kronecker-Factored Hessian

---

## 剔除方向

- Papers 1/5/8/10/11/12/14/15/16/17/18/20/23/24/29/31/32/33/34/36/37/38/39/41/42/43/44/49: neural network等关键词误匹配，实为纯ML理论/生物/物理/人脸识别等非通信网络领域
- Paper 4 (OD-Gear): 车辆路由优化，非通信网络routing
- Paper 27/28: 软件安全测试工具，无网络机制
- Paper 40: FMCW雷达高度计干扰消除，非通信系统
- Paper 9/19/22/26/30/35/45: 已在8/19-8/22推荐且本批无新证据
- News 7 (Ericsson/SoftBank 5G AI调度): 已在8/22推荐且无新进展
- News 46 (Cisco SNMP演进): 已在8/20推荐且无新进展
- Paper 47 (Multi-Timescale Interventions): 已在8/21推荐，Paper 13从不确定性安全滤波新角度单独成方向

## 候选数据摘要（Top 15）

| # | 类型 | 标题 | Network AI | 分数 |
|---|------|------|-----------|------|
| paper | - | From Independent to Correlated Diffusion: Gener... | ✅ | 18 |
| paper | - | HybridFlow: Resource-Adaptive Subtask Routing f... | ✅ | 17 |
| paper | - | Statistically-Lossless Quantization of Large La... | ✅ | 17 |
| paper | - | OD-Gear: Online Decomposition and Group Samplin... | ❌ | 13 |
| paper | - | neuralGAM: An R Package for Fitting Generalized... | ✅ | 13 |
| paper | - | MoE-Prism: Disentangling Monolithic Experts for... | ✅ | 13 |
| news | Ericsson | SoftBank and Ericsson test AI scheduler on live... | ❌ | 13 |
| paper | - | A Coupled Physics-Informed Neural Network for G... | ✅ | 12 |
| paper | - | CGRL: Causal-Guided Representation Learning for... | ✅ | 12 |
| paper | - | Compatibility of Face Embeddings Across Deep Ne... | ✅ | 12 |
| paper | - | Autonomous Reliability Qualification of Ga$_2$O... | ❌ | 12 |
| paper | - | Scalable extensions to given-data Sobol' index ... | ✅ | 12 |
| paper | - | Uncertainty-Aware Predictive Safety Filters for... | ✅ | 12 |
| paper | - | An Information-Theoretic Framework for Feature ... | ✅ | 11 |
| paper | - | Hybrid Quantum-Classical PINNs for Scientific C... | ✅ | 11 |
