# 技术洞察方向发掘 — 2026-07-14

数据范围：最近 14 天 | 论文 300 篇 | 新闻 100 条 | 候选 317 条

---

## 🔴 分离式LLM推理集群MoE专家感知路由与会话级调度优化

**优先级:** 1/5 | **置信度:** high

Prefill-Decode分离架构下MoE推理面临专家权重分散与Agent负载突发挑战。ELDR提出专家局部性感知路由降低权重加载延迟，SMetric引入会话级TPS调度适配Agent突发负载，Omni-Flow实现多模态推理跨节点KV缓存共享。推理集群从简单负载均衡向模型结构-网络拓扑联合调度演进。

- **网络对象:** AI推理集群GPU池间网络、Prefill-Decode分离式数据中心拓扑
- **AI 方法:** MoE专家局部性路由、负载感知请求偏转、会话级吞吐量调度
- **软件技术栈:** vLLM推理框架、分离式Prefill/Decode调度器
- **欧洲连接:** 无直接连接
- **华为关联:** AI集群网络架构设计、CloudEngine数据中心交换、推理服务部署优化

**支撑证据:**
- [ELDR: Expert-Locality-Aware Decode Routing for PD-Disaggregated MoE Serving](http://arxiv.org/abs/2607.00466v1)
- [Towards Load-Aware Prefill Deflection for Disaggregated LLM Serving](http://arxiv.org/abs/2607.02043v1)
- [SMetric: Rethink LLM Scheduling for Serving Agents with Balanced Session-centric Scheduling](http://arxiv.org/abs/2607.08565v1)
- [Omni-Flow: A Unified Workflow Orchestration and Distributed KV Cache Sharing Framework for Multimodal Inference](http://arxiv.org/abs/2606.31093v1)

---

## 🔴 LLM跨域分布式训练驱动光传输网新型技术使能与容错

**优先级:** 2/5 | **置信度:** high

大规模LLM训练向地理分布式扩展，对光传输网提出WAN-aware集合通信、ZR+可插拔光模块、空芯光纤等新需求。NVIDIA提出非均匀张量并行应对GPU掉队与故障，训练Goodput显著提升。光网络从被动管道向训练感知智能传输演进，与LLM形成双向共生：训练依赖光网络承载，光网络借LLM实现智能运维。

- **网络对象:** WAN光传输网络、AI训练集群跨域互联、ZR+光模块
- **AI 方法:** 分布式训练并行策略、非均匀张量并行容错
- **软件技术栈:** 分布式训练框架（Megatron）、WAN-aware CCL算法
- **欧洲连接:** 欧洲光网络设备商（Nokia、ADVA/Adtran）在ZR+与空芯光纤领域有核心参与
- **华为关联:** iMaster NCE光域控制、光网络智能运维、AI集群跨域互联架构

**支撑证据:**
- [LLMs and Optical Networks: A Symbiotic Relationship](http://arxiv.org/abs/2606.30278v1)
- [Enhancing Goodput in Large-Scale LLM Training with Nonuniform Tensor Parallelism](https://developer.nvidia.com/blog/enhancing-goodput-in-large-scale-llm-training-with-nonuniform-tensor-parallelism/)

---

## 🟡 6G RIS-OFDM联合优化从凸松弛到基础模型方法论演进

**优先级:** 3/5 | **置信度:** medium

系统综述78篇RIS-OFDM联合优化文献，覆盖和速率最大化、能效优化、最大最小公平、PAPR约束四类目标。方法从凸松弛与交替优化演进至GNN和基础模型驱动的端到端求解，首次在统一基准上对比传统数学优化与AI方法的性能边界，揭示MINLP问题中基础模型的适用条件与局限。

- **网络对象:** 6G智能反射面（RIS）、OFDM波形设计、无线物理层优化
- **AI 方法:** 图神经网络（GNN）、基础模型（Foundation Model）、深度展开优化
- **欧洲连接:** 6G RIS研究涉及欧盟Horizon计划与ETSI RIS工作组标准化推进
- **华为关联:** 6G预研、RIS智能反射面技术、无线AI优化算法

**支撑证据:**
- [Optimization Algorithms for Joint OFDM Waveform Design and RIS Configuration in 6G Networks: From Convex Relaxation to Foundation Models](http://arxiv.org/abs/2606.31334v1)

---

## ⚪ IoT异构拓扑下GNN与KAN融合的网络入侵检测增强架构

**优先级:** 4/5 | **置信度:** medium

针对IoT网络动态拓扑、流量不均衡与复杂攻击模式，提出GNN与Kolmogorov-Arnold网络（KAN）融合的入侵检测架构。GNN建模设备间拓扑依赖关系，KAN以可学习激活函数替代固定激活增强非线性特征表达。相比传统MLP+GNN方案，在稀疏异构IoT拓扑上检测精度与跨场景泛化能力均有提升。

- **网络对象:** IoT异构网络拓扑、网络流量检测面
- **AI 方法:** 图神经网络（GNN）、Kolmogorov-Arnold网络（KAN）、图结构特征增强
- **欧洲连接:** 无直接连接
- **华为关联:** 网络安全检测引擎、IoT网络管理与安全

**支撑证据:**
- [Enhanced Feature Extraction for IoT Network Intrusion Detection Using GNNs and KAN](http://arxiv.org/abs/2607.02981v1)

---

## 剔除方向

- Paper 1 (Hawk): NPU kernel生成，网络关键词为误匹配，纯硬件AI编译器方向
- Paper 4 (CLOUDADV): 云VM选型advisory，无网络机制，纯云基础设施
- Paper 5 (HYPIC): KV缓存位置无关化，与方向1主题相关但侧重缓存技术而非网络调度，未单独成方向
- Paper 6 (SmoothAgent): LLM Agent上下文工程优化，无具体网络对象
- Paper 7 (Experience Graphs): 纯AI数据系统架构（Meta），无网络关联
- Paper 11 (Agentic-V2X): SLM驱动V2X调度，已被07-10方向覆盖（SLM Agent+V2X调度器均已提及）
- Paper 12 (PHaul): IAB PPO转发代理，已被07-14 Sub6-IAB方向覆盖
- Paper 13 (EnclaveX): CPU/GPU TEE机密AI推理，网络连接薄弱
- Paper 14 (Compliance Mapping): 云安全合规自动映射，网络特异性不足
- Paper 15 (Memory Injection): 持久化Agent记忆注入攻击，纯AI安全非网络场景
- Paper 16 (Spatio-Temporal CBF): 已被07-11 GNN协作波束赋形方向覆盖
- Paper 17 (BaseRT): Apple Silicon Metal推理运行时，非网络方向
- Paper 18 (QuCo): GPU Tile传输硬件配置，纯硬件架构
- Paper 19 (Uni-STC): 统一稀疏张量核，纯硬件架构
- Paper 20 (Contract-based Intent): O-RAN意图合约框架（INFOCOM），已被07-10意图方向覆盖
- Paper 21 (Athena): CPU预取+离片预测RL协同，非通信网络
- Paper 23 (Privacy Intent): 已被07-13隐私保护意图方向覆盖
- Paper 24 (Guard Rail): 已被07-10 Guard Rail方向覆盖
- Paper 26 (Prompts to Contracts): 企业LLM Agent工程化，网络连接薄弱
- Paper 27 (EvoOMG): 已被07-13 Wi-Fi 7/8方向覆盖
- Paper 28 (UAV QoAIS): 已被07-13 UAV-6G方向覆盖
- Paper 29 (ORAN-DEFEND): 已被07-10 O-RAN后门检测方向覆盖

## 候选数据摘要（Top 15）

| # | 类型 | 标题 | Network AI | 分数 |
|---|------|------|-----------|------|
| paper | arXiv | Hawk: Harnessing Hardware-Aware Knowledge for H... | ✅ | 18 |
| paper | arXiv | Towards Load-Aware Prefill Deflection for Disag... | ✅ | 18 |
| paper | arXiv | Optimization Algorithms for Joint OFDM Waveform... | ✅ | 17 |
| paper | arXiv | CLOUDADV: Decision-Aligned Instance Sizing with... | ✅ | 17 |
| paper | arXiv | HYPIC: Accelerating Hybrid-Attention LLM Servin... | ✅ | 17 |
| paper | arXiv | SmoothAgent: Efficient Long-Horizon LLM-Based A... | ✅ | 17 |
| paper | arXiv | Experience Graphs: The Data Foundation for Self... | ✅ | 17 |
| paper | arXiv | ELDR: Expert-Locality-Aware Decode Routing for ... | ✅ | 15 |
| paper | arXiv | Enhanced Feature Extraction for IoT Network Int... | ✅ | 14 |
| paper | arXiv | LLMs and Optical Networks: A Symbiotic Relation... | ✅ | 14 |
| paper | arXiv | Agentic-V2X: Small Language Model Agents for De... | ✅ | 13 |
| paper | arXiv | PHaul: A PPO-based forwarding agent for Sub6 en... | ✅ | 13 |
| paper | arXiv | EnclaveX: End-to-End Confidential AI with CPU/G... | ✅ | 13 |
| paper | arXiv | Automated Compliance Mapping in Cloud Security ... | ✅ | 13 |
| paper | arXiv | When Claws Remember but Do Not Tell: Stealthy M... | ✅ | 13 |
