# 技术洞察方向发掘 — 2026-08-28

数据范围：最近 14 天 | 论文 200 篇 | 新闻 100 条 | 候选 244 条

---

## 🔴 Ericsson AI调度器5G实网验证加速RAN智能控制产业收敛

**优先级:** 1/5 | **置信度:** high

SoftBank与Ericsson在日本5G实网测试AI调度器，标志RAN智能控制从仿真走向商用验证。这是继Cisco AgenticOps、Nokia光网Agent后，又一欧洲设备商将AI闭环嵌入生产网络的产业信号。实网验证数据（调度增益、干扰协调效果）将为RAN智能化提供关键基准线，直接影响O-RAN rApp/xApp的AI策略选择与部署路径。

- **网络对象:** 5G RAN无线调度器
- **AI 方法:** AI调度优化（具体算法待公开）
- **软件技术栈:** O-RAN RIC、rApp/xApp框架
- **欧洲连接:** Ericsson（瑞典）为核心技术提供方，O-RAN标准化参与方
- **华为关联:** 直接对标华为RAN智能控制方向，iMaster NCE无线域自治调度。Ericsson实网验证数据将成为行业基准，需关注其AI调度增益指标与华为方案对比

**支撑证据:**
- [SoftBank and Ericsson test AI scheduler on live Japan 5G network](https://news.google.com/rss/articles/CBMioAFBVV95cUxQaEtMd2xna2JvSGFsVlNBUWd0c01nTmQ3dEY4aEw3WWVDRkRSZXJDV3NvYVdpYW9WZHBQRW5YRmpGcGVTUGtUVTN6blFjYlNQZlp4Q09tY1laekppY3djZG5Ia29laHotT01OVkdWcGNULUdlV1dQYU5aWENzNV9vMUdrQlNvanY2YjEwM2llc1U3T0dhU2hvQXVRN1NDWTFL?oc=5)

---

## 🔴 🔄 LLM推理解耦架构从并行设计走向随机负载自适应调度

**优先级:** 2/5 | **置信度:** high | **更新**

三篇新论文从不同层面深化Attention-FFN解耦(AFD)推理架构：P-PAS提出Prefill压力自适应批调度解决长上下文请求的尾延迟问题，Q-First以最小改动实现Attention与FFN并行执行，AFD Analytical Provisioning首次用排队论对解耦架构在随机负载下的资源配置建立解析模型。三者协同表明AFD架构正从'能不能解耦'进入'如何在生产负载下最优配置'阶段，对AI集群网络的流量模式和带宽规划有直接影响。

- **网络对象:** AI集群网络、RoCE/IB互联fabric
- **AI 方法:** LLM推理服务调度、排队论建模
- **软件技术栈:** vLLM、解耦式LLM serving框架
- **欧洲连接:** Paper 1含BT相关机构参与（待确认）
- **华为关联:** AFD架构中Attention节点与FFN节点间每步通信对AI集群网络带宽和延迟要求极高。随机负载建模为华为CloudFabric AI集群网络的流量工程和带宽预留策略提供理论依据
- **🔄 更新原因:** 相比8月26-27日推荐，新增P-PAS的Prefill压力自适应调度机制和AFD排队论解析配置模型两项新证据，从工程实现和理论建模两端补全AFD架构研究图景

**支撑证据:**
- [P-PAS: Prefill-Pressure Adaptive Scheduling for Long-Context LLM Serving](https://arxiv.org/abs/2608.15171)
- [Q-First: Attention and Feed-Forward Concurrency at the Smallest Change to the Block](https://arxiv.org/abs/2608.15473)
- [Analytical Provisioning for Attention-FFN Disaggregated LLM Serving under Stochastic Workloads](https://arxiv.org/abs/2601.21351)

---

## 🟡 Agentic算子自动生成范式对网络可编程数据面合成启示

**优先级:** 3/5 | **置信度:** medium

NVIDIA提出用通用代码Agent自动生成SOTA级GPU算子（Fused MoE、稀疏Attention等），无需手写CUDA即达到或超越人工优化水平。这一'Agent驱动算子合成'范式可类比迁移至网络可编程数据面：用AI Agent自动生成P4/eBPF程序实现特定转发逻辑，替代人工手写数据面程序。核心挑战同构——硬件约束下的性能优化、正确性验证、多目标权衡——使GPU算子合成的Agent架构设计（搜索策略、测试反馈闭环）可为网络数据面编程自动化提供直接技术参考。

- **网络对象:** 可编程数据面（P4交换机、eBPF/XDP）
- **AI 方法:** AI Agent代码生成、搜索式程序合成
- **软件技术栈:** P4/eBPF编译工具链、可编程交换芯片
- **欧洲连接:** 无直接连接，但P4标准化及eBPF在欧洲网络社区活跃
- **华为关联:** 直接关联CloudEngine可编程数据面和iMaster NCE编排层。若Agent能自动合成P4程序，可大幅降低网络功能开发周期，与华为自动驾驶网络中'意图→配置→数据面'全链自动化目标吻合

**支撑证据:**
- [Agentic Kernel Optimization: Generating State-of-the-Art GPU Kernels Without Hand-Written CUDA](https://arxiv.org/abs/2608.14560)

---

## ⚪ 🔄 KV Cache进化搜索与多类公平反馈控制协同深化演进

**优先级:** 4/5 | **置信度:** medium | **更新**

两篇新论文从互补角度推进KV Cache管理：CacheCraft用LLM引导的程序进化自动搜索淘汰策略，突破手工启发式在跨模型、跨压缩比下的脆弱性；生物物理启发的反馈控制器则解决多租户LLM服务中不同类别(系统提示/用户文档/代码/对话)共享缓存池时的公平性问题。两者可形成'策略发现→多类公平执行'的两层架构。缓存管理模式与网络QoS队列调度高度同构——进化搜索对应自适应流量策略发现，多类公平控制对应差异化服务保障。

- **网络对象:** AI推理服务集群、网络QoS队列调度（类比）
- **AI 方法:** LLM引导程序进化搜索、生物启发反馈控制
- **软件技术栈:** LLM serving缓存管理、推理框架
- **欧洲连接:** Paper 31含EU相关机构
- **华为关联:** 缓存淘汰策略进化搜索可迁移至网络侧自适应策略发现（如iMaster NCE流量调度策略自动优化）。多类公平控制与网络QoS差异化服务同构，为华为网络大模型推理部署的资源管理提供技术参考
- **🔄 更新原因:** 相比8月27日推荐，新增CacheCraft的LLM引导程序进化搜索机制，与此前多类公平反馈控制形成'策略发现+公平执行'两层互补架构，深化技术图景

**支撑证据:**
- [Discovering KV Cache Eviction Policies via LLM-Guided Program Evolution](https://arxiv.org/abs/2608.14555)
- Paper 31: A Biophysically-Inspired Feedback Controller for Multi-Class Cache Fairness

---

## 剔除方向

- idx 7 Quantum Kernel Learning: quantum computing非通信网络，剔除
- idx 10 AgentMV音乐视频生成: 无网络机制，纯多媒体生成
- idx 13 AWED-PIPER NER/PII: 纯NLP隐私保护，无网络对象
- idx 18 Career Path Recommendation: 职业推荐，无网络相关性
- idx 22/24/25/32/44/45/46/49 视觉/NLP/天文等: networkKeywords均为误匹配（RAN/RIC为非通信含义），无实际网络对象
- idx 26 Neural Network Field Theory: 物理学中neural network，非通信网络
- idx 30 Nokia Agentic光网: 2026-08-27刚推荐且为同一新闻源，无新增证据，暂不重复
- idx 9 Belayer RL容错: 2026-08-26已推荐同一论文，无新角度
- idx 23 LTL RL零样本: 2026-08-24已推荐，本批为v2更新但无实质新内容
- idx 38 UAV+MEC Agentic调度: 有网络元素但场景过于细分（无人机物流），产业参考价值有限
- idx 11 CyberFactory: 网络安全方向但论文聚焦通用LLM安全能力，非网络机制层面
- idx 2 FlashQuant: 2026-08-26已推荐同主题稀疏稠密融合量化，本篇为同期相似工作

## 候选数据摘要（Top 15）

| # | 类型 | 标题 | Network AI | 分数 |
|---|------|------|-----------|------|
| paper | - | P-PAS: Prefill-Pressure Adaptive Scheduling for... | ✅ | 18 |
| paper | - | FlashQuant: Sparse-Dense Fusion for Memory-Effi... | ✅ | 16 |
| paper | - | Q-First: Attention and Feed-Forward Concurrency... | ✅ | 14 |
| paper | - | Agentic Kernel Optimization: Generating State-o... | ✅ | 14 |
| paper | - | Analytical Provisioning for Attention-FFN Disag... | ✅ | 14 |
| paper | - | PolyWorkBench: Benchmarking LLM Agents for Cros... | ✅ | 13 |
| paper | - | Experimentally Extending Quantum Kernel Learnin... | ❌ | 13 |
| news | Ericsson | SoftBank and Ericsson test AI scheduler on live... | ❌ | 13 |
| paper | - | Belayer: Efficient Fault Tolerance for LLM Agen... | ✅ | 12 |
| paper | - | AgentMV: A State-Guided Multi-Agent Framework f... | ✅ | 12 |
| paper | - | CyberFactory: Scaling Cyber Security Capabiliti... | ✅ | 12 |
| paper | - | Discovering KV Cache Eviction Policies via LLM-... | ✅ | 11 |
| paper | - | AWED-PIPER: Agents, Web Applications &amp; Expe... | ✅ | 11 |
| paper | - | LatentSkill: From In-Context Textual Skills to ... | ✅ | 11 |
| paper | - | Speculative Rollback Correction for Quality-Div... | ✅ | 11 |
