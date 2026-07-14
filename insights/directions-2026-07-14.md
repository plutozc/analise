# 技术洞察方向发掘 — 2026-07-14

数据范围：最近 7 天 | 论文 200 篇 | 新闻 100 条 | 候选 258 条

---

## 🔴 🔄 Sub6增强IAB网络中PPO智能转发代理架构与验证

**优先级:** 2/5 | **置信度:** high | **更新**

PHaul针对Sub6增强IAB网络提出PPO驱动的智能转发代理。Sub6频段扩展缓解毫米波回传瓶颈，PPO策略在数字孪生环境中训练，优化多跳IAB拓扑的转发决策。论文提供端到端仿真验证，与3GPP IAB标准对齐，展示了具体的Sub6频段回传增强架构设计和性能量化分析。

- **网络对象:** 3GPP IAB多跳回传网络、Sub6频段无线回传
- **AI 方法:** PPO策略梯度强化学习、数字孪生训练环境
- **欧洲连接:** 3GPP标准框架、EU资助标注
- **华为关联:** IAB回传方案与华为5G RAN产品直接相关，PPO轻量化RL可部署于RAN智能控制器，数字孪生训练范式对齐网络数字地图方向
- **🔄 更新原因:** 相比07-10推荐新增PHaul论文，提供Sub6频段增强IAB的具体转发代理架构设计，此前推荐侧重MAB/PPO/SLM的横向范式比较，本文为Sub6+IAB纵向深入

**支撑证据:**
- [PHaul: A PPO-based forwarding agent for Sub6 enhanced Integrated Access and Backhaul networks](http://arxiv.org/abs/2607.07584v1)

---

## 🟡 面向智能体工作负载的大模型推理调度与端侧部署演进

**优先级:** 3/5 | **置信度:** medium

智能体负载与人类交互负载特征显著不同：智能体仅消费完整响应，集群吞吐量取代首token延迟成为核心优化目标。SMetric提出会话中心调度策略平衡吞吐与公平性。端侧方面，STEEL在AMD XDNA NPU上实现稀疏感知注意力融合内核，大幅降低长序列推理能耗。两者共同揭示推理服务从云端集群到边缘NPU的架构分层趋势。

- **网络对象:** AI集群计算网络、端侧推理节点
- **AI 方法:** 稀疏注意力优化、会话级推理调度算法
- **软件技术栈:** 推理框架（调度层）、NPU编译器与注意力内核
- **欧洲连接:** 无直接连接
- **华为关联:** 直接关联昇腾NPU推理优化与MindSpore推理框架，Agentic负载调度可指导华为AI推理集群资源编排，端侧推理优化与Atlas边缘推理产品竞争分析相关

**支撑证据:**
- [SMetric: Rethink LLM Scheduling for Serving Agents with Balanced Session-centric Scheduling](http://arxiv.org/abs/2607.08565v1)
- [STEEL: Sparsity-Aware Fused Attention for Energy-Efficient Long-Sequence Inference on AMD's XDNA NPU](http://arxiv.org/abs/2607.09385v1)

---

## 🟡 工业物联网多层攻击面下智能体驱动安全闭环自主控制

**优先级:** 3/5 | **置信度:** medium

IT/OT融合使工控系统暴露于跨软件、网络、物理层的多阶段攻击。ProvICS将溯源图分析从IT域扩展至ICS，实现OT跨层攻击链追踪与检测。Neuro-Agentic以LLM Agent构建OT安全控制闭环，将语义推理与深度学习检测融合。车联网领域，RL+RLHF实现自适应异常检测，应对OTA更新导致的系统行为漂移。三者共同揭示IoT网络安全从被动告警向AI驱动自主闭环的范式演进。

- **网络对象:** 工控网络（ICS/SCADA）、车联网（V2X）、IoT遥测
- **AI 方法:** LLM Agent闭环控制、溯源图异常检测、强化学习+人类反馈（RLHF）
- **软件技术栈:** 闭环安全控制框架、微服务监控
- **欧洲连接:** 无直接连接
- **华为关联:** 与自动驾驶网络安全运维维度对齐，LLM Agent闭环控制模式可迁移至NCE安全策略自动编排，车联网安全方案关联华为V2X产品线

**支撑证据:**
- [ProvICS: A Provenance-based Intrusion Detection for Industrial Control Systems](http://arxiv.org/abs/2607.05989v1)
- [Neuro-Agentic Control: A Deep Learning-based LLM-Powered Agentic AI Framework for Controlling Security Controls](http://arxiv.org/abs/2607.09076v1)
- [Self-Adaptive Anomaly Detection with Reinforcement Learning and Human Feedback in Connected Vehicles](http://arxiv.org/abs/2607.08373v1)

---

## ⚪ 网络AI智能体规模化部署的欧盟合规挑战与安全治理

**优先级:** 4/5 | **置信度:** medium

EU网络韧性法案(CRA)基于漏洞发现慢、攻击工具受限等前提假设，但AI智能体规模化部署正在颠覆这些假设——自动化漏洞发现和攻击生成使CRA的过程型安全框架面临失效风险。三十位国际专家系统梳理Agentic AI安全与隐私挑战，覆盖供应链、数据投毒、越权执行等维度。电信领域，区块链审计框架为AI驱动欺诈控制决策提供全生命周期可追溯性。三者揭示网络AI部署的治理缺口。

- **网络对象:** 电信运营网络、网络AI智能体部署面
- **AI 方法:** Agentic AI、LLM决策推理
- **软件技术栈:** 区块链审计框架、合规追溯系统
- **欧洲连接:** EU CRA法规、Horizon项目资助、欧洲学术与政府专家组
- **华为关联:** 华为欧洲业务直接受EU CRA约束，自动驾驶网络AI Agent部署需合规框架，可审计决策管理与iMaster NCE运维智能体治理需求对齐

**支撑证据:**
- [Certifying Ghosts: How Cybersecurity AI Agents Break the EU Cyber Resilience Act](http://arxiv.org/abs/2607.07109v1)
- [Security and Privacy in Agentic AI: Grand Challenges and Future Directions](http://arxiv.org/abs/2607.06608v1)
- [Blockchain-Linked Auditable Decision Management for Telecom/IoT Fraud-Control Requests](http://arxiv.org/abs/2607.09259v1)

---

## 剔除方向

- Paper 2 (LoCA视觉模型适配)：纯通用AI，RAN/RIC为关键词误检
- Paper 3 (代码Agent形式化验证)：纯软件验证，rApp/RAN为关键词误检
- Paper 6 (云安全合规Transformer映射)：云安全合规自动化，无网络传输机制
- Paper 7 (时空调度预测CBF)：与07-11推荐'GNN补偿协作波束赋形'为同一论文
- Paper 8 (车联网联邦RL抗投毒)：与07-13推荐'数字孪生增强FRL车联网防护'为同一论文
- Paper 9 (量子ALNS车辆路由)：非通信网络，量子+VRP物流优化
- Paper 11 (6G RAN隐私意图)：与07-13推荐'6G意图驱动隐私保护'为同一论文
- Paper 12 (ORAN-DEFEND后门检测)：与07-10推荐'O-RAN智能体可信运行'为同一论文
- Paper 13 (企业LLM Agent工程)：纯LLM Agent产品化，routing指实体路由非网络路由
- Paper 14 (EvoOMG Wi-Fi MLO)：与07-13推荐'Wi-Fi 7/8多链路优化'为同一论文
- Paper 16 (UAV 6G QoAIS)：与07-13推荐'UAV辅助6G资源调配'为同一论文
- Paper 17/18/19/20/22/23 (软件工程/水印/多语言/Web搜索/因果/工具优化Agent)：纯通用LLM Agent研究，无网络机制
- Paper 21 (SLORR低秩正则化)：纯通用模型压缩技术，虽有UCL/Horizon连接但无网络相关性
- Paper 24 (GemNav机器人导航)：机器人视觉导航，无网络
- Paper 25 (Agentic到Autogenic网络管理)：与07-10推荐'6G AI Agent标准化路径'为同一论文
- News 10 (AT&T/Ericsson 5G感知演示)：仅一条新闻无配套论文，证据不足独立成方向，可作为ISAC技术跟踪
- 本周候选数据中约60%论文的网络关键词(RIC/RAN/RoCE)为NLP误检，实际为纯通用AI/Agent研究

## 候选数据摘要（Top 15）

| # | 类型 | 标题 | Network AI | 分数 |
|---|------|------|-----------|------|
| paper | arXiv | Certifying Ghosts: How Cybersecurity AI Agents ... | ✅ | 17 |
| paper | arXiv | LoCA: Spatially-Aware Low-Rank Convolutional Ad... | ✅ | 15 |
| paper | arXiv | Harnessing Code Agents for Automatic Software V... | ✅ | 15 |
| paper | arXiv | Self-Adaptive Anomaly Detection with Reinforcem... | ✅ | 14 |
| paper | arXiv | PHaul: A PPO-based forwarding agent for Sub6 en... | ✅ | 13 |
| paper | arXiv | Automated Compliance Mapping in Cloud Security ... | ✅ | 13 |
| paper | arXiv | Spatio-Temporal Scheduling Prediction Under Bac... | ✅ | 13 |
| paper | arXiv | Securing Autonomous Vehicle Systems via Twin-Aw... | ✅ | 13 |
| paper | arXiv | RL-Guided Quantum-ALNS for Constrained VRP | ❌ | 13 |
| news | Ericsson | AT&T, Ericsson demo 5G network sensing - teleco... | ❌ | 13 |
| paper | arXiv | Privacy-Preserving Intent Fulfilment and Assura... | ✅ | 12 |
| paper | arXiv | ORAN-DEFEND: Subspace Detection and Sanitizatio... | ✅ | 12 |
| paper | arXiv | From Prompts to Contracts: Harness Engineering ... | ✅ | 12 |
| paper | arXiv | EvoOMG: An Evolution-Oriented Multi-Agent Guida... | ✅ | 12 |
| paper | arXiv | SMetric: Rethink LLM Scheduling for Serving Age... | ✅ | 12 |
