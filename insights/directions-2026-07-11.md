# 技术洞察方向发掘 — 2026-07-11

数据范围：最近 7 天 | 论文 200 篇 | 新闻 100 条 | 候选 244 条

---

## 🔴 图神经网络时空预测补偿5G协作波束赋形回传时延失配

**优先级:** 1/5 | **置信度:** high

5G分布式协作波束赋形依赖基站间调度信息交换，但回传时延导致信息过时，甚至使协作增益低于非协作基线。本文提出基于图神经网络的时空调度预测模型，将多小区拓扑建模为图结构，利用GNN捕获空间关联与时序演化规律，在回传信息到达前预测邻区调度决策，实现弹性CBF-SLNR波束赋形。量化验证表明即使单TTI延迟下仍可恢复协作增益。

- **网络对象:** 5G RAN协作波束赋形（CBF）、基站间回传链路、多小区调度协调
- **AI 方法:** 图神经网络（GNN）、时空序列预测
- **欧洲连接:** EU Horizon项目资助
- **华为关联:** 与RAN智能控制及网络数字地图直接相关：GNN建模小区拓扑可扩展为无线网络数字孪生的预测层；回传延迟补偿是自动驾驶网络闭环控制的关键挑战

**支撑证据:**
- [Spatio-Temporal Scheduling Prediction Under Backhaul Delay for Resilient Coordinated Beamforming](http://arxiv.org/abs/2607.08454v1)

---

## 🔴 小语言模型驱动LEO卫星网络BBR拥塞控制自适应

**优先级:** 1/5 | **置信度:** high

LEO卫星网络的快速路径变化和间歇性容量波动使BBR等传输层拥塞控制算法性能退化。本文首次将小语言模型（SLM）引入传输协议控制回路，SLM基于网络遥测序列动态调整BBR参数（如pacing_gain、cwnd_gain），替代手工规则和传统RL。实验表明SLM能捕获非地面网络的复杂时延动态，实现自适应拥塞控制，且模型轻量可部署于端侧。

- **网络对象:** LEO卫星网络传输层、BBR拥塞控制协议
- **AI 方法:** 小语言模型（SLM）、序列化网络状态推理
- **欧洲连接:** 无直接连接（AWS参与，但卫星网络与ESA/欧洲NTN标准化相关）
- **华为关联:** 与自动驾驶网络和网络大模型高度相关：SLM控制传输协议是网络大模型从管理面下沉到协议面的前沿探索；华为在NTN/卫星网络有布局

**支撑证据:**
- [Small Language Model-based Control for BBR over Low Earth Orbit Satellite Internet](http://arxiv.org/abs/2607.07142v1)

---

## 🔴 O-RAN AI模型运行时漂移自适应与xApp部署实测验证

**优先级:** 2/5 | **置信度:** high

O-RAN AI/ML模型部署后面临流量模式动态变化导致的模型漂移问题。ADORN提出基于强化学习的自适应漂移处理框架，在检测到性能退化时自动选择轻量级适应策略（而非完整重训练），降低计算开销同时满足SLA约束。另一工作首次系统实测Near-RT RIC内xApp的端到端AI推理延迟，揭示从数据采集到决策执行的真实时序瓶颈，为10ms-1s闭环控制提供工程基准。

- **网络对象:** O-RAN Near-RT RIC、xApp、RAN闭环控制
- **AI 方法:** 强化学习驱动的模型漂移自适应、AI推理延迟实测分析
- **欧洲连接:** 无直接连接（O-RAN Alliance有欧洲运营商深度参与）
- **华为关联:** 与NCE和自动驾驶网络核心挑战直接相关：AI模型部署后的持续运维（MLOps）和实时性保障是网络智能从实验室走向商用的关键瓶颈

**支撑证据:**
- [ADORN: Adaptive Drift handling for Open RAN using Reinforcement Learning](http://arxiv.org/abs/2607.08443v1)
- [Enabling Real-Time AI in O-RAN: Deploying and Measuring AI Inside a Near-RT RIC xApp](http://arxiv.org/abs/2607.01583v2)

---

## 🟡 分布式LLM推理中KV缓存跨节点网络传输加速技术

**优先级:** 3/5 | **置信度:** medium

分离式LLM推理架构中，prefill与decode阶段分布在不同节点，大规模KV缓存的跨网络传输成为解码启动延迟的瓶颈。Lynx提出渐进式投机量化方法，在传输过程中逐步提升KV精度，使解码可在完整传输完成前提前启动。HYPIC则针对RAG/Agent场景提出位置无关缓存机制，支持混合注意力架构下的KV缓存复用，减少重复prefill计算。两者从网络传输和计算缓存两个维度优化AI集群通信效率。

- **网络对象:** 数据中心网络、RoCE/RDMA、AI集群互联
- **AI 方法:** 投机量化传输、位置无关KV缓存、LLM推理服务优化
- **欧洲连接:** 无直接连接
- **华为关联:** 与AI集群网络方向直接相关：KV缓存传输优化是大模型推理网络的核心问题，涉及华为CloudEngine/CloudFabric AI集群网络的关键技术需求

**支撑证据:**
- [Lynx: Progressive Speculative Quantization for accelerating KV Transfer in Long-Context Inference](http://arxiv.org/abs/2607.01831v1)
- [HYPIC: Accelerating Hybrid-Attention LLM Serving with Position-Independent Caching](http://arxiv.org/abs/2607.01299v1)

---

## 剔除方向

- Paper 1 (PHaul IAB+PPO): 与7/10已推荐'RAN实时智能控制中轻量化RL'方向重叠，同批论文
- Paper 2 (Agentic-V2X SLM): 与7/10已推荐'RAN实时智能控制中轻量化RL'方向重叠，同批论文
- Paper 3 (Memory Injection): 个人AI Agent安全，非通信网络AI
- Paper 4 (Cloud Security Compliance): 云安全合规NLP，非网络AI
- Paper 6 (EvoAgentBench): 通用AI Agent评测基准，无网络机制
- Paper 7 (UAV 6G QoAIS): 网络AI但UAV场景过窄，单篇支撑不足
- Paper 8 (ORAN-DEFEND): 与7/10已推荐'O-RAN智能体可信运行'方向重叠，同一论文
- Paper 9 (EvoOMG Wi-Fi MLO): Wi-Fi网络AI但非核心电信方向，欧洲连接弱
- Paper 10 (SE Agent Eval): 软件工程Agent评测，非网络AI
- Paper 11 (Agentic SABRE): 勒索软件检测，非通信网络
- Paper 12 (Agentic→Autogenic): 与7/10已推荐'6G网络自治AI Agent标准化'方向重叠，同一论文
- Paper 13 (Adaptive Batching): 推理服务调度优化，网络对象不明确
- Paper 15 (Agentic AI Security): 通用AI安全挑战综述，无网络机制
- Paper 16 (AGL-1 Governance): 企业AI治理，非网络AI
- Paper 17 (NN Verification): 神经网络验证，此处neural network指ML模型非通信网络
- Paper 18 (EU CRA): 纯政策法规分析
- Paper 19 (MAB xApp): 与7/10已推荐'RAN实时智能控制中轻量化RL'方向重叠
- Paper 21 (Agent Malware): AI Agent供应链安全，非通信网络
- Paper 22 (KB Poisoning IoBT): 军事LLM-RAG安全，非电信网络
- Paper 23 (FL Point Cloud): 联邦学习用于3D点云，非通信网络AI
- Paper 28 (MCP IPoDWDM): 与7/10已推荐'Agentic AI与MCP驱动光传送网'方向重叠，同一论文
- Paper 30 (Cloud-Edge LLM): 云边协同训练，网络机制偏弱
- News 24 (Huawei Chair): 公司战略新闻，非技术深度方向
- News 25 (Tencent MoE): 通用AI模型开源，非网络AI

## 候选数据摘要（Top 15）

| # | 类型 | 标题 | Network AI | 分数 |
|---|------|------|-----------|------|
| paper | arXiv | PHaul: A PPO-based forwarding agent for Sub6 en... | ✅ | 13 |
| paper | arXiv | Agentic-V2X: Small Language Model Agents for De... | ✅ | 13 |
| paper | arXiv | When Claws Remember but Do Not Tell: Stealthy M... | ✅ | 13 |
| paper | arXiv | Automated Compliance Mapping in Cloud Security ... | ✅ | 13 |
| paper | arXiv | Spatio-Temporal Scheduling Prediction Under Bac... | ✅ | 13 |
| paper | arXiv | EvoAgentBench: Benchmarking Agent Self-Evolutio... | ✅ | 13 |
| paper | arXiv | Quality-Aware Personalized AI Service Provision... | ✅ | 12 |
| paper | arXiv | ORAN-DEFEND: Subspace Detection and Sanitizatio... | ✅ | 12 |
| paper | arXiv | EvoOMG: An Evolution-Oriented Multi-Agent Guida... | ✅ | 12 |
| paper | arXiv | Reliable and Developer-Aligned Evaluation of Ag... | ✅ | 12 |
| paper | arXiv | Agentic SABRE: An Uncertainty-Aware Neuro-Symbo... | ✅ | 12 |
| paper | arXiv | From Agentic to Autogenic Network Management fo... | ✅ | 11 |
| paper | arXiv | Adaptive Inference Batching using Policy Gradients | ✅ | 11 |
| paper | arXiv | HYPIC: Accelerating Hybrid-Attention LLM Servin... | ✅ | 11 |
| paper | arXiv | Security and Privacy in Agentic AI: Grand Chall... | ✅ | 11 |
